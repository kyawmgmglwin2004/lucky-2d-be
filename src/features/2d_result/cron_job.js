import cron from "node-cron";
import fetch from "node-fetch";
import AutoPayoutService from "./two_d_result_service.js";

async function getResultFromAPI() {
    try {
        const res = await fetch("https://api.thaistock2d.com/live");
        const data = await res.json();

        console.log("📡 API Data fetched");

        return data.result;
    } catch (err) {
        console.error("❌ API fetch error:", err);
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function extractWinningNumber(results, session) {
    const targetTime = session === "morning"
        ? "12:01:00"
        : "16:30:00";

    console.log("🔍 Checking Result...");
    console.log("📌 Session:", session);
    console.log("⏰ Target Time:", targetTime);

    const result = results.find(
        r => r.open_time === targetTime && r.twod !== "--"
    );

    return result ? result.twod : null;
}

function getCurrentDate() {
    const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Yangon"
    });

    return new Date(now).toISOString().slice(0, 10);
}

async function runAutoPayoutCron(session) {
    try {
        console.log("⏳ Running auto payout cron...");

        const currentDate = getCurrentDate();

        let winningNumber = null;
        let attempts = 0;

        const maxAttempts = 6;
        const delay = 20000;

        while (!winningNumber && attempts < maxAttempts) {
            console.log(`🔁 Attempt ${attempts + 1}/${maxAttempts}`);

            const results = await getResultFromAPI();
            if (!results) return;

            winningNumber = extractWinningNumber(results, session);

            if (winningNumber) break;

            console.log("⌛ Result not ready, retrying...");
            attempts++;

            if (attempts < maxAttempts) {
                await sleep(delay);
            }
        }

        if (!winningNumber) {
            console.log("Result not available after retries");
            return;
        }

        console.log(`🎯 Result detected → ${winningNumber} (${session})`);

        const payoutResult = await AutoPayoutService.runAutoPayoutService(
            winningNumber,
            session,
            currentDate
        );

        console.log("Payout Response:", payoutResult);

    } catch (err) {
        console.error("Cron job error:", err);
    }
}

cron.schedule(
    "2 12 * * 1-5",
    async () => {
        console.log("12:01 PM Cron Triggered");
        await runAutoPayoutCron("morning");
    },
    {
        timezone: "Asia/Yangon"
    }
);

cron.schedule(
    "32 16 * * 1-5",
    async () => {
        console.log("4:30 PM Cron Triggered");
        await runAutoPayoutCron("evening");
    },
    {
        timezone: "Asia/Yangon"
    }
);

console.log("Auto payout cron started (Mon–Fri | 12:01 PM & 4:30 PM)");