import * as Sentry from "@sentry/node";
import Queue from "bull";
import moment from "moment";
import { Op, QueryTypes } from "sequelize";
import { isEmpty, isNil, isArray } from "lodash";
import path from "path";
import { CronJob } from "cron";
import { subMinutes } from "date-fns";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import Whatsapp from "./models/Whatsapp";
import { logger } from "./utils/logger";
import Schedule from "./models/Schedule";
import Contact from "./models/Contact";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import Campaign from "./models/Campaign";
import ContactList from "./models/ContactList";
import ContactListItem from "./models/ContactListItem";
import CampaignSetting from "./models/CampaignSetting";
import CampaignShipping from "./models/CampaignShipping";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import sequelize from "./database";
import { getMessageFileOptions } from "./services/WbotServices/SendWhatsAppMedia";
import { getIO } from "./libs/socket";
import User from "./models/User";
import Company from "./models/Company";
import Plan from "./models/Plan";
import TicketTraking from "./models/TicketTraking";
import { GetCompanySetting } from "./helpers/CheckSettings";
import { getWbot } from "./libs/wbot";
import Ticket from "./models/Ticket";
import QueueModel from "./models/Queue";
import UpdateTicketService from "./services/TicketServices/UpdateTicketService";
import { handleMessage } from "./services/WbotServices/wbotMessageListener";
import ShowService from "./services/CampaignService/ShowService";
import Invoices from "./models/Invoices";
import formatBody, { mustacheFormat } from "./helpers/Mustache";

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface DispatchCampaignData {
  campaignId: number;
  campaignShippingId: number;
  contactListItemId: number;
}

export const userMonitor = new Queue("UserMonitor", connection);

export const messageQueue = new Queue("MessageQueue", connection, {
  limiter: {
    max: limiterMax as number,
    duration: limiterDuration as number
  }
});

export const scheduleMonitor = new Queue("ScheduleMonitor", connection);
export const sendScheduledMessages = new Queue(
  "SendSacheduledMessages",
  connection
);

export const campaignQueue = new Queue("CampaignQueue", connection);

async function handleSendMessage(job) {
  try {
    const { data } = job;

    const whatsapp = await Whatsapp.findByPk(data.whatsappId);

    if (whatsapp == null) {
      throw Error("Whatsapp não identificado");
    }

    const messageData: MessageData = data.data;

    await SendMessage(whatsapp, messageData);
  } catch (e: unknown) {
    Sentry.captureException(e);
    logger.error("MessageQueue -> SendMessage: error", (e as Error).message);
    throw e;
  }
}

async function handleVerifySchedules() {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          [Op.lte]: moment().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss")
        }
      },
      include: [{ model: Contact, as: "contact" }]
    });
    if (count > 0) {
      schedules.map(async schedule => {
        await schedule.update({
          status: "AGENDADA"
        });
        sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000 }
        );
        logger.info(`Disparo agendado para: ${schedule.contact.name}`);
      });
    }
  } catch (e: unknown) {
    Sentry.captureException(e);
    logger.error("SendScheduledMessage -> Verify: error", (e as Error).message);
    throw e;
  }
}

async function handleSendScheduledMessage(job) {
  const {
    data: { schedule }
  } = job;
  let scheduleRecord: Schedule | null = null;

  try {
    scheduleRecord = await Schedule.findByPk(schedule.id, {
      include: [
        { model: Contact, as: "contact" },
        { model: User, as: "user" }
      ]
    });
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
  }

  try {
    const whatsapp = await GetDefaultWhatsApp(schedule.companyId);

    const message = await SendMessage(whatsapp, {
      number: schedule.contact.number,
      body: mustacheFormat({
        body: schedule.body,
        contact: schedule.contact,
        currentUser: schedule.user
      })
    });

    if (schedule.saveMessage) {
      handleMessage(
        message,
        await GetWhatsappWbot(whatsapp),
        schedule.companyId
      );
    }

    await scheduleRecord?.update({
      sentAt: new Date(),
      status: "ENVIADA"
    });

    logger.info(`Mensagem agendada enviada para: ${schedule.contact.name}`);
    sendScheduledMessages.clean(15000, "completed");
  } catch (e: unknown) {
    Sentry.captureException(e);
    await scheduleRecord?.update({
      status: "ERRO"
    });
    logger.error(
      "SendScheduledMessage -> SendMessage: error",
      (e as Error).message
    );
    throw e;
  }
}

async function handleVerifyCampaigns() {
  /**
   * @todo
   * Implementar filtro de campanhas
   */
  const campaigns: { id: number; scheduledAt: string }[] =
    await sequelize.query(
      `select id, "scheduledAt" from "Campaigns" c
    where "scheduledAt" between now() and now() + '1 hour'::interval and status = 'PROGRAMADA'`,
      { type: QueryTypes.SELECT }
    );

  if (campaigns.length) {
    logger.info(`Campanhas encontradas: ${campaigns.length}`);
  }
  campaigns.forEach(campaign => {
    try {
      const now = moment();
      const scheduledAt = moment(campaign.scheduledAt);
      const delay = scheduledAt.diff(now, "milliseconds");
      logger.info(
        `Campanha enviada para a fila de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`
      );
      campaignQueue.add(
        "ProcessCampaign",
        {
          id: campaign.id,
          delay
        },
        {
          removeOnComplete: true
        }
      );
    } catch (err: unknown) {
      Sentry.captureException(err);
    }
  });
}

async function getCampaign(id: number) {
  return Campaign.findByPk(id, {
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: ["id", "name", "number", "email", "isWhatsappValid"],
            where: { isWhatsappValid: true }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: CampaignShipping,
        as: "shipping",
        include: [{ model: ContactListItem, as: "contact" }]
      }
    ]
  });
}

async function getSettings(campaign) {
  const settings = await CampaignSetting.findAll({
    where: { companyId: campaign.companyId },
    attributes: ["key", "value"]
  });

  let messageInterval = 20;
  let longerIntervalAfter = 20;
  let greaterInterval = 60;
  let variables: any[] = [];

  settings.forEach(setting => {
    if (setting.key === "messageInterval") {
      messageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "longerIntervalAfter") {
      longerIntervalAfter = JSON.parse(setting.value);
    }
    if (setting.key === "greaterInterval") {
      greaterInterval = JSON.parse(setting.value);
    }
    if (setting.key === "variables") {
      variables = JSON.parse(setting.value);
    }
  });

  return {
    messageInterval,
    longerIntervalAfter,
    greaterInterval,
    variables
  };
}

export function parseToMilliseconds(seconds: number) {
  return seconds * 1000;
}

export async function sleep(seconds: number) {
  logger.info(
    `Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Sleep de ${seconds} segundos finalizado: ${moment().format(
          "HH:mm:ss"
        )}`
      );
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function getCampaignValidMessages(campaign) {
  const messages = [];

  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) {
    messages.push(campaign.message1);
  }

  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) {
    messages.push(campaign.message2);
  }

  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) {
    messages.push(campaign.message3);
  }

  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) {
    messages.push(campaign.message4);
  }

  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) {
    messages.push(campaign.message5);
  }

  return messages;
}

function getCampaignValidConfirmationMessages(campaign) {
  const messages = [];

  if (
    !isEmpty(campaign.confirmationMessage1) &&
    !isNil(campaign.confirmationMessage1)
  ) {
    messages.push(campaign.confirmationMessage1);
  }

  if (
    !isEmpty(campaign.confirmationMessage2) &&
    !isNil(campaign.confirmationMessage2)
  ) {
    messages.push(campaign.confirmationMessage2);
  }

  if (
    !isEmpty(campaign.confirmationMessage3) &&
    !isNil(campaign.confirmationMessage3)
  ) {
    messages.push(campaign.confirmationMessage3);
  }

  if (
    !isEmpty(campaign.confirmationMessage4) &&
    !isNil(campaign.confirmationMessage4)
  ) {
    messages.push(campaign.confirmationMessage4);
  }

  if (
    !isEmpty(campaign.confirmationMessage5) &&
    !isNil(campaign.confirmationMessage5)
  ) {
    messages.push(campaign.confirmationMessage5);
  }

  return messages;
}

function getProcessedMessage(msg: string, variables: any[], contact: any) {
  let finalMessage = msg;

  if (finalMessage.includes("{nome}")) {
    finalMessage = finalMessage.replace(/{nome}/g, contact.name);
  }

  if (finalMessage.includes("{email}")) {
    finalMessage = finalMessage.replace(/{email}/g, contact.email);
  }

  if (finalMessage.includes("{numero}")) {
    finalMessage = finalMessage.replace(/{numero}/g, contact.number);
  }

  variables.forEach(variable => {
    if (finalMessage.includes(`{${variable.key}}`)) {
      const regex = new RegExp(`{${variable.key}}`, "g");
      finalMessage = finalMessage.replace(regex, variable.value);
    }
  });

  return finalMessage;
}

export function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}

async function verifyAndFinalizeCampaign(campaign: Campaign) {
  const data = await ShowService(campaign.id);

  if (data.valids === data.delivered) {
    await campaign.update({ status: "FINALIZADA", completedAt: moment() });
  }

  const io = getIO();
  io.emit(`company-${campaign.companyId}-campaign`, data);
}

async function prepareContact(
  campaign: Campaign,
  variables: any[],
  contact: ContactListItem,
  delay: number,
  messages: string | any[],
  confirmationMessages: string | any[]
) {
  const campaignShipping: any = {};
  campaignShipping.number = contact.number;
  campaignShipping.contactId = contact.id;
  campaignShipping.campaignId = campaign.id;

  if (messages.length) {
    const radomIndex = randomValue(0, messages.length);
    const message = getProcessedMessage(
      messages[radomIndex],
      variables,
      contact
    );
    campaignShipping.message = `${message}`;
  }

  if (campaign.confirmation) {
    if (confirmationMessages.length) {
      const radomIndex = randomValue(0, confirmationMessages.length);
      const message = getProcessedMessage(
        confirmationMessages[radomIndex],
        variables,
        contact
      );
      campaignShipping.confirmationMessage = `${message}`;
    }
  }

  const [record, created] = await CampaignShipping.findOrCreate({
    where: {
      campaignId: campaignShipping.campaignId,
      contactId: campaignShipping.contactId
    },
    defaults: campaignShipping
  });

  if (
    !created &&
    record.deliveredAt === null &&
    record.confirmationRequestedAt === null
  ) {
    record.set(campaignShipping);
    await record.save();
  }

  if (record.deliveredAt === null && record.confirmationRequestedAt === null) {
    const nextJob = await campaignQueue.add(
      "DispatchCampaign",
      {
        campaignId: campaign.id,
        campaignShippingId: record.id,
        contactListItemId: contact.id
      },
      {
        delay
      }
    );

    await record.update({ jobId: `${nextJob.id}` });
  }
}

async function handleProcessCampaign(job) {
  try {
    const { id }: ProcessCampaignData = job.data;
    let { delay }: ProcessCampaignData = job.data;
    const campaign = await getCampaign(id);
    const settings = await getSettings(campaign);
    if (campaign) {
      const { contacts } = campaign.contactList;
      const messages = getCampaignValidMessages(campaign);
      const confirmationMessages = campaign.confirmation
        ? getCampaignValidConfirmationMessages(campaign)
        : null;
      if (isArray(contacts)) {
        let index = 0;
        contacts.forEach(contact => {
          prepareContact(
            campaign,
            settings.variables,
            contact,
            delay,
            messages,
            confirmationMessages
          ).then(() => {
            logger.info(
              `Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contact.name};Delay=${delay}`
            );
          });

          index += 1;
          if (index % settings.longerIntervalAfter === 0) {
            // intervalo maior após intervalo configurado de mensagens
            delay += parseToMilliseconds(settings.greaterInterval);
          } else {
            delay += parseToMilliseconds(
              randomValue(0, settings.messageInterval)
            );
          }
        });
        await campaign.update({ status: "EM_ANDAMENTO" });
      }
    }
  } catch (err: unknown) {
    Sentry.captureException(err);
  }
}

async function handleDispatchCampaign(job) {
  try {
    const { data } = job;
    const { campaignShippingId, campaignId }: DispatchCampaignData = data;
    const campaign = await Campaign.findByPk(campaignId, {
      include: ["contactList", { model: Whatsapp, as: "whatsapp" }]
    });

    if (!campaign) {
      logger.error({ data }, "Campaign not found");
      return;
    }

    const wbot = await GetWhatsappWbot(campaign.whatsapp);

    logger.info(
      `Disparo de campanha solicitado: Campanha=${campaignId};Registro=${campaignShippingId}`
    );

    const campaignShipping = await CampaignShipping.findByPk(
      campaignShippingId,
      {
        include: [{ model: ContactListItem, as: "contact" }]
      }
    );

    const chatId = `${campaignShipping.number}@s.whatsapp.net`;

    if (campaign.confirmation && campaignShipping.confirmation === null) {
      await wbot.sendMessage(chatId, {
        text: campaignShipping.confirmationMessage
      });
      await campaignShipping.update({ confirmationRequestedAt: moment() });
    } else {
      await wbot.sendMessage(chatId, {
        text: campaignShipping.message
      });
      if (campaign.mediaPath) {
        const filePath = path.resolve("public", campaign.mediaPath);
        const options = await getMessageFileOptions(
          campaign.mediaName,
          filePath
        );
        if (Object.keys(options).length) {
          await wbot.sendMessage(chatId, { ...options });
        }
      }
      await campaignShipping.update({ deliveredAt: moment() });
    }

    await verifyAndFinalizeCampaign(campaign);

    const io = getIO();
    io.emit(`company-${campaign.companyId}-campaign`, {
      action: "update",
      record: campaign
    });

    logger.info(
      `Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`
    );
  } catch (err: unknown) {
    Sentry.captureException(err);
    logger.error((err as Error).message);
  }
}

async function handleLoginStatus() {
  const users: { id: number }[] = await sequelize.query(
    'select id from "Users" where "updatedAt" < now() - \'5 minutes\'::interval and online = true',
    { type: QueryTypes.SELECT }
  );
  users.forEach(async item => {
    try {
      const user = await User.findByPk(item.id);
      await user.update({ online: false });
      logger.info(`Usuário passado para offline: ${item.id}`);
    } catch (e: unknown) {
      Sentry.captureException(e);
    }
  });
}

async function setRatingExpired(tracking, date) {
  const wbot = getWbot(tracking.whatsapp.id);

  tracking.update({
    finishedAt: date,
    expired: true
  });

  const complationMessage =
    tracking.whatsapp.complationMessage.trim() || "Atendimento finalizado";

  await wbot.sendMessage(
    `${tracking.ticket.contact.number}@${
      tracking.ticket.isGroup ? "g.us" : "s.whatsapp.net"
    }`,
    {
      text: formatBody(
        `\u200e${complationMessage}`,
        tracking.ticket.contact,
        tracking.ticket
      )
    }
  );

  logger.debug({ tracking }, "rating timedout");
}

async function handleRatingsTimeout() {
  const openTrackingRatings = await TicketTraking.findAll({
    where: {
      rated: false,
      expired: false,
      finishedAt: null,
      ratingAt: { [Op.not]: null }
    },
    include: [
      {
        model: Ticket,
        include: [
          {
            model: Contact
          },
          {
            model: User
          },
          {
            model: QueueModel,
            as: "queue"
          }
        ]
      },
      {
        model: Whatsapp
      }
    ]
  });

  const ratingThresholds = [];
  const currentTime = new Date();

  // eslint-disable-next-line no-restricted-syntax
  for await (const tracking of openTrackingRatings) {
    if (!ratingThresholds[tracking.companyId]) {
      const timeout =
        parseInt(
          await GetCompanySetting(tracking.companyId, "ratingsTimeout", "5"),
          10
        ) || 5;

      ratingThresholds[tracking.companyId] = subMinutes(currentTime, timeout);
    }
    if (tracking.ratingAt < ratingThresholds[tracking.companyId]) {
      setRatingExpired(tracking, currentTime);
    }
  }
}

async function handleNoQueueTimeout(
  company: Company,
  timeout: number,
  action: number
) {
  logger.trace(
    {
      timeout,
      action,
      companyId: company?.id
    },
    "handleNoQueueTimeout"
  );
  const groupsTab =
    (await GetCompanySetting(company.id, "groupsTab", "disabled")) ===
    "enabled";

  const tickets = await Ticket.findAll({
    where: {
      status: "pending",
      companyId: company.id,
      queueId: null,
      isGroup: groupsTab ? false : undefined,
      updatedAt: {
        [Op.lt]: subMinutes(new Date(), timeout)
      }
    }
  });

  const status = action ? "pending" : "closed";
  const queueId = action || null;

  tickets.forEach(ticket => {
    const userId = status === "pending" ? null : ticket.userId;
    UpdateTicketService({
      ticketId: ticket.id,
      ticketData: { status, userId, queueId },
      companyId: company.id
    })
      .then(response => {
        logger.trace(
          { response },
          "handleNoQueueTimeout -> UpdateTicketService"
        );
      })
      .catch(error => {
        logger.error(
          { error, message: error?.message },
          "handleNoQueueTimeout -> UpdateTicketService"
        );
      });
  });
}

async function handleOpenTicketTimeout(
  company: Company,
  timeout: number,
  status: string
) {
  logger.trace(
    {
      timeout,
      status,
      companyId: company?.id
    },
    "handleOpenTicketTimeout"
  );
  const tickets = await Ticket.findAll({
    where: {
      status: "open",
      companyId: company.id,
      updatedAt: {
        [Op.lt]: subMinutes(new Date(), timeout)
      }
    }
  });

  tickets.forEach(ticket => {
    UpdateTicketService({
      ticketId: ticket.id,
      ticketData: {
        status,
        queueId: ticket.queueId,
        userId: status !== "pending" ? ticket.userId : null
      },
      companyId: company.id
    })
      .then(response => {
        logger.trace(
          { response },
          "handleOpenTicketTimeout -> UpdateTicketService"
        );
      })
      .catch(error => {
        logger.error(
          { error, message: error?.message },
          "handleOpenTicketTimeout -> UpdateTicketService"
        );
      });
  });
}

async function handleTicketTimeouts() {
  logger.trace("handleTicketTimeouts");
  const companies = await Company.findAll();

  companies.forEach(async company => {
    logger.trace({ companyId: company?.id }, "handleTicketTimeouts -> company");
    const noQueueTimeout = Number(
      await GetCompanySetting(company.id, "noQueueTimeout", "0")
    );
    if (noQueueTimeout) {
      const noQueueTimeoutAction = Number(
        await GetCompanySetting(company.id, "noQueueTimeoutAction", "0")
      );
      handleNoQueueTimeout(company, noQueueTimeout, noQueueTimeoutAction || 0);
    }
    const openTicketTimeout = Number(
      await GetCompanySetting(company.id, "openTicketTimeout", "0")
    );
    if (openTicketTimeout) {
      const openTicketTimeoutAction = await GetCompanySetting(
        company.id,
        "openTicketTimeoutAction",
        "pending"
      );
      handleOpenTicketTimeout(
        company,
        openTicketTimeout,
        openTicketTimeoutAction
      );
    }
  });
}

async function handleEveryMinute() {
  handleLoginStatus();
  handleRatingsTimeout();
  handleTicketTimeouts();
}

const createInvoices = new CronJob("0 * * * * *", async () => {
  const companies = await Company.findAll();
  companies.map(async c => {
    const dueDate = new Date(c.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 20) {
      const plan = await Plan.findByPk(c.planId);

      const invoiceCount = await Invoices.count({
        where: {
          companyId: c.id,
          dueDate: {
            [Op.like]: `${dueDate.toISOString().split("T")[0]}%`
          }
        }
      });

      if (invoiceCount === 0) {
        await Invoices.destroy({
          where: {
            companyId: c.id,
            status: "open"
          }
        });
        await Invoices.create({
          detail: plan.name,
          status: "open",
          value: plan.value,
          dueDate: dueDate.toISOString().split("T")[0],
          companyId: c.id
        });
      }
    }
  });
});

createInvoices.start();

export async function startQueueProcess() {
  logger.info("Iniciando processamento de filas");

  messageQueue.process("SendMessage", handleSendMessage);

  scheduleMonitor.process("Verify", handleVerifySchedules);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  campaignQueue.process("VerifyCampaignsDaatabase", handleVerifyCampaigns);

  campaignQueue.process("ProcessCampaign", handleProcessCampaign);

  campaignQueue.process("DispatchCampaign", handleDispatchCampaign);

  campaignQueue.process("DispatchConfirmedCampaign", handleDispatchCampaign);

  userMonitor.process("EveryMinute", handleEveryMinute);

  scheduleMonitor.add(
    "Verify",
    {},
    {
      repeat: { cron: "*/5 * * * * *" },
      removeOnComplete: true
    }
  );

  campaignQueue.add(
    "VerifyCampaignsDaatabase",
    {},
    {
      repeat: { cron: "*/20 * * * * *" },
      removeOnComplete: true
    }
  );

  userMonitor.add(
    "EveryMinute",
    {},
    {
      repeat: { cron: "* * * * *" },
      removeOnComplete: true
    }
  );
}
