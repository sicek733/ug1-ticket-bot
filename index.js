import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const ticketTypes = [
  { label: "🔔 الدعم الفني", value: "tech" },
  { label: "💚 تذكرة متجر", value: "store" },
  { label: "🚨 شكوى على لاعب", value: "player" },
  { label: "🔵 شكوى على إداري", value: "admin" },
  { label: "🧾 طلب فك باند", value: "unban" },
  { label: "💰 طلب تعويض", value: "refund" },
  { label: "👑 الإدارة العليا", value: "high" },
  { label: "🎬 صانع محتوى", value: "creator" }
];

const SUPPORT_ROLE = process.env.SUPPORT_ROLE;
const ADMIN_ROLE = process.env.ADMIN_ROLE;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.content === "!tickets") {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("اختر نوع التذكرة")
      .addOptions(ticketTypes);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setTitle("🎫 نظام التذاكر")
      .setDescription("اختر نوع التذكرة")
      .setColor(0x5865F2);

    msg.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const type = interaction.values[0];

  const existing = interaction.guild.channels.cache.find(c =>
    c.name === `ticket-${interaction.user.id}`
  );

  if (existing) {
    return interaction.reply({ content: "عندك تذكرة مفتوحة", ephemeral: true });
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.id}`,
    type: ChannelType.GuildText,
    parent: process.env.CATEGORY_ID,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ...(SUPPORT_ROLE ? [{ id: SUPPORT_ROLE, allow: [PermissionsBitField.Flags.ViewChannel] }] : []),
      ...(ADMIN_ROLE ? [{ id: ADMIN_ROLE, allow: [PermissionsBitField.Flags.ViewChannel] }] : [])
    ]
  });

  const btn = new ButtonBuilder()
    .setCustomId("close_ticket")
    .setLabel("إغلاق")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(btn);

  channel.send({
    content: `<@${interaction.user.id}> نوع التذكرة: ${type}`,
    components: [row]
  });

  interaction.reply({ content: "تم فتح التذكرة", ephemeral: true });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "close_ticket") {
    const log = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL);

    if (log) {
      log.send(`تم إغلاق: ${interaction.channel.name}`);
    }

    await interaction.reply({ content: "جاري الإغلاق...", ephemeral: true });

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});

client.login(process.env.TOKEN);
