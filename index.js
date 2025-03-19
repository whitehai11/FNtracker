require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('track')
        .setDescription('Zeigt Fortnite-Statistiken eines Spielers an')
        .addStringOption(option =>
            option.setName('spieler')
                .setDescription('Gib den Fortnite-Benutzernamen ein')
                .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        console.log('Lade Slash-Commands...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash-Commands erfolgreich registriert!');
    } catch (error) {
        console.error(error);
    }
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'track') {
        const spielername = interaction.options.getString('spieler');

        try {
            const response = await axios.get(`https://fortnite-api.com/v2/stats/br/v2?name=${spielername}`, {
                headers: { 'Authorization': process.env.FORTNITE_API_KEY }
            });

            const stats = response.data.data.stats.all.overall;

            const statsEmbed = {
                color: 0x0099ff,
                title: `📊 Fortnite-Statistiken für ${spielername}`,
                fields: [
                    { name: '🏆 Siege', value: `${stats.wins}`, inline: true },
                    { name: '💀 Kills', value: `${stats.kills}`, inline: true },
                    { name: '⚔️ K/D-Verhältnis', value: `${stats.kd}`, inline: true },
                    { name: '🕹️ Gespielte Matches', value: `${stats.matches}`, inline: true },
                    { name: '🎯 Trefferquote', value: `${stats.hitAccuracy}%`, inline: true },
                    { name: '⏳ Spielzeit', value: `${Math.round(stats.minutesPlayed / 60)} Stunden`, inline: true }
                ],
                footer: { text: 'Daten bereitgestellt von Fortnite-API.com' }
            };

            await interaction.reply({ embeds: [statsEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply('❌ Fehler beim Abrufen der Statistiken oder Spieler nicht gefunden!');
        }
    }
});

client.login(process.env.TOKEN);
