const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

// Bot Ayarları
const TOKEN = "BOT_TOKEN"; // Bot tokeninizi buraya ekleyin
const CLIENT_ID = "BOT_CLIENT_ID"; // Botunuzun Client ID'sini buraya ekleyin
const GUILD_ID = "GUILD_ID"; // Sunucunuzun ID'sini buraya ekleyin
const UPTIME_CHANNEL = "UPTIME_KANAL_ID"; // Uptime mesajının gönderileceği kanalın ID'si
const PREMIUM_ROLE_ID = "PREMIUM_ROL_ID"; // Premium rolünün ID'si
const BOT_OWNER_ID = "BOT_OWNER_ID"; // Bot sahibinin kullanıcı ID'si

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
let linkList = {}; // Kullanıcıların linklerini tutacak bir obje (Kullanıcı ID: Link Listesi)

// Slash Komutlarını Kaydetme
const commands = [
  {
    name: "link-ekle",
    description: "Bir link ekle ve botunu aktif tut!",
    options: [
      {
        name: "link",
        type: 3, // STRING
        description: "Eklemek istediğiniz link",
        required: true,
      },
    ],
  },
  {
    name: "link-sil",
    description: "Eklediğin bir linki sil!",
    options: [
      {
        name: "link",
        type: 3, // STRING
        description: "Silmek istediğiniz link",
        required: true,
      },
    ],
  },
  {
    name: "link-liste",
    description: "Ekli linkleri listele!",
  },
  {
    name: "ping",
    description: "Botun yanıt süresini gösterir.",
  },
  {
    name: "profil",
    description: "Kendi profil bilgilerini gösterir.",
  },
  {
    name: "pre-ver",
    description: "Bir kullanıcıya premium rolü ver.",
    options: [
      {
        name: "kullanici",
        type: 6, // USER
        description: "Premium rolü verilecek kullanıcı",
        required: true,
      },
    ],
  },
  {
    name: "pre-al",
    description: "Bir kullanıcıdan premium rolünü al.",
    options: [
      {
        name: "kullanici",
        type: 6, // USER
        description: "Premium rolü alınacak kullanıcı",
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 Slash komutları yükleniyor...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ Slash komutları başarıyla yüklendi!");
  } catch (error) {
    console.error("❌ Komut yükleme hatası:", error);
  }
})();

// Bot Olayları
client.on("ready", () => {
  console.log(`✅ Bot başarıyla giriş yaptı! Kullanıcı: ${client.user.tag}`);

  // Uptime Kanalına Mesaj Gönderme
  const channel = client.channels.cache.get(UPTIME_CHANNEL);
  if (channel) {
    const panelEmbed = new EmbedBuilder()
      .setTitle("# DünyaUptime | Hoşgeldiniz!")
      .setDescription(
        `⚙️ **Seçenekler:**\n\n` +
        `🟢 **Link Ekle**: Bir link ekleyin ve botunuz 7/24 aktif olsun!\n` +
        `🔴 **Link Sil**: Eklediğiniz bir linki silin.\n` +
        `📄 **Liste**: Ekli linklerinizi kontrol edin.`
      )
      .setColor("Green");

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("link-ekle")
        .setLabel("Link Ekle")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("link-sil")
        .setLabel("Link Sil")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("link-liste")
        .setLabel("Liste")
        .setStyle(ButtonStyle.Primary)
    );

    channel.send({ embeds: [panelEmbed], components: [buttons] });
  }
});

// Slash Komutları İşleme
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user, guild } = interaction;

  if (commandName === "link-ekle") {
    const link = options.getString("link");
    const member = await guild.members.fetch(user.id);
    const isPremium = member.roles.cache.has(PREMIUM_ROLE_ID);
    const maxLinks = isPremium ? 10 : 3;

    if (!linkList[user.id]) linkList[user.id] = [];
    if (linkList[user.id].length >= maxLinks) {
      return interaction.reply({
        content: `❌ Maksimum ${maxLinks} link ekleyebilirsiniz!`,
        ephemeral: true,
      });
    }

    linkList[user.id].push(link);
    interaction.reply({ content: `✅ Link başarıyla eklendi: ${link}` });
    console.log(`🔗 Yeni link eklendi: ${link} (Kullanıcı: ${user.tag})`);
  }

  if (commandName === "link-sil") {
    const link = options.getString("link");

    if (!linkList[user.id] || !linkList[user.id].includes(link)) {
      return interaction.reply({
        content: "❌ Bu link ekli değil!",
        ephemeral: true,
      });
    }

    linkList[user.id] = linkList[user.id].filter((l) => l !== link);
    interaction.reply({ content: `✅ Link başarıyla silindi: ${link}` });
    console.log(`❌ Link silindi: ${link} (Kullanıcı: ${user.tag})`);
  }

  if (commandName === "link-liste") {
    const userLinks = linkList[user.id] || [];
    if (userLinks.length === 0) {
      return interaction.reply({
        content: "❌ Ekli linkiniz yok!",
        ephemeral: true,
      });
    }

    interaction.reply({
      content: `📄 Ekli linkleriniz:\n${userLinks.join("\n")}`,
      ephemeral: true,
    });
    console.log(`📄 Linkler listelendi (Kullanıcı: ${user.tag})`);
  }

  if (commandName === "ping") {
    interaction.reply({ content: `🏓 Pong! Botun gecikmesi: ${Date.now() - interaction.createdTimestamp}ms` });
  }

  if (commandName === "profil") {
    interaction.reply({
      content: `👤 Profil Bilgileri\n\n` +
               `**Kullanıcı Adı:** ${user.username}\n` +
               `**Tag:** ${user.discriminator}\n` +
               `**ID:** ${user.id}`,
      ephemeral: true,
    });
  }

  // Premium Rol Yönetimi
  if (commandName === "pre-ver" || commandName === "pre-al") {
    if (user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: "❌ Bu komutu sadece bot sahibi kullanabilir!", ephemeral: true });
    }

    const target = options.getMember("kullanici");

    if (commandName === "pre-ver") {
      await target.roles.add(PREMIUM_ROLE_ID);
      interaction.reply({ content: `✅ ${target} kullanıcısına premium rolü verildi!` });
    } else if (commandName === "pre-al") {
      await target.roles.remove(PREMIUM_ROLE_ID);
      interaction.reply({ content: `✅ ${target} kullanıcısından premium rolü alındı!` });
    }
  }
});

// Buton İşlemleri
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, user } = interaction;

  if (customId === "link-ekle") {
    interaction.reply({
      content: "🟢 `/link-ekle` komutunu kullanarak link ekleyebilirsiniz!",
      ephemeral: true,
    });
  }

  if (customId === "link-sil") {
    interaction.reply({
      content: "🔴 `/link-sil` komutunu kullanarak bir link silebilirsiniz!",
      ephemeral: true,
    });
  }

  if (customId === "link-liste") {
    const userLinks = linkList[user.id] || [];
    if (userLinks.length === 0) {
      return interaction.reply({
        content: "❌ Ekli linkiniz yok!",
        ephemeral: true,
      });
    }

    interaction.reply({
      content: `📄 Ekli linkleriniz:\n${userLinks.join("\n")}`,
      ephemeral: true,
    });
  }
});

// Botu Girişe Aktif Et
client.login(TOKEN);
