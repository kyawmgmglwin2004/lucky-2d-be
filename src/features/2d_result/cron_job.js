import cron from "node-cron";
import fetch from "node-fetch";
import AutoPayoutService from "./two_d_result_service.js";


async function getResultFromAPI() {
    try {
        const res = await fetch("https://api.thaistock2d.com/live");
        const data = await res.json();

        console.log("API Data:", data);

        return data.result;
    } catch (err) {
        console.error("❌ API fetch error:", err);
        return null;
    }
}


function getSessionAndDate() {
    const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Yangon"
    });

    const dateObj = new Date(now);

    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();

    const currentDate = dateObj.toISOString().slice(0, 10);

    let session = "morning";

    const currentTime = hours * 60 + minutes;
    const morningCutoff = 10 * 60 + 30;

    if (currentTime >= morningCutoff) {
        session = "evening";
    }

    return { session, currentDate };
}


function extractWinningNumber(results, session) {
    const targetTime = session === "morning"
        ? "12:01:00"
        : "16:30:00";

    const result = results.find(
        r => r.open_time === targetTime && r.twod !== "--"
    );

    console.log("🔍 Checking Result...");
    console.log("Session:", session);
    console.log("Target Time:", targetTime);

    return result ? result.twod : null;
}


async function runAutoPayoutCron() {
    try {
        console.log("⏳ Running auto payout cron...");

        const results = await getResultFromAPI();
        if (!results) {
            console.log(" No API data");
            return;
        }

        const { session, currentDate } = getSessionAndDate();

        const winningNumber = extractWinningNumber(results, session);

        if (!winningNumber) {
            console.log("⌛ Result not ready yet...");
            return;
        }

        console.log(`🎯 Result detected → ${winningNumber} (${session})`);

        const payoutResult = await AutoPayoutService.runAutoPayoutService(
            winningNumber,
            session,
            currentDate
        );

        console.log("✅ Payout Response:", payoutResult);

    } catch (err) {
        console.error("❌ Cron job error:", err);
    }
}
cron.schedule(
    "1 12 * * 1-5",
    async () => {
        console.log("🕛 12:01 PM Cron Triggered");
        await runAutoPayoutCron();
    },
    {
        timezone: "Asia/Yangon"
    }
);


cron.schedule(
    "31 16 * * 1-5",
    async () => {
        console.log("🕟 4:31 PM Cron Triggered");
        await runAutoPayoutCron();
    },
    {
        timezone: "Asia/Yangon"
    }
);

console.log("Auto payout cron started (Mon–Fri | 12:01 PM & 4:31 PM)");