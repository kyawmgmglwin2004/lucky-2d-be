import cron from "node-cron";
import fetch from "node-fetch";
import AutoPayoutService from "./two_d_result_service.js";
import twoDService from "../admin/2d/two_d_service.js";

async function getResultFromAPI() {
    try {
        const res = await fetch("https://api.thaistock2d.com/live");

        if (!res.ok) {
            console.error("❌ API Status Error:", res.status);
            return null;
        }

        const contentType = res.headers.get("content-type");

        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("❌ Not JSON response:", text);
            return null;
        }

        const data = await res.json();
        console.log("results =====", data)
        return data;

    } catch (err) {
        console.error("❌ API fetch error:", err);
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function extractWinningNumber(results, session, live) {
    const targetTime = session === "morning"
        ? "12:01:00"
        : "16:31:00";

    let result = results.find(r => r.open_time === targetTime);

    if (result && result.twod !== "--") {
        return {
            twod: result.twod,
            set: result.set,
            value: result.value,
            open_time: result.open_time,
            open_date: result.stock_date,
        };
    }

    if (live && live.twod !== "--") {
        console.log("⚡ Using live data because result is '--'");
        return {
            twod: live.twod,
            set: live.set,
            value: live.value,
            open_time: live.time,
            open_date: live.date,
        };
    }

    return null;
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

        let winningData = null;
        let attempts = 0;

        const maxAttempts = 6;
        const delay = 20000;

        while (!winningData && attempts < maxAttempts) {
            console.log(`🔁 Attempt ${attempts + 1}/${maxAttempts}`);

            const data = await getResultFromAPI();
            if (!data) return;

            const results = data.result;
            const live = data.live;

            winningData = extractWinningNumber(results, session, live);

            if (winningData) break;

            console.log("⌛ Result not ready, retrying...");
            attempts++;

            if (attempts < maxAttempts) {
                await sleep(delay);
            }
        }

        if (!winningData) {
            console.log("❌ Result not available after retries");
            return;
        }

        console.log(`🎯 Result detected → ${winningData.twod} (${session})`);
        console.log(`📊 Set: ${winningData.set}, Value: ${winningData.value}`);

        const saveResponse = await AutoPayoutService.saveResult(
            winningData.twod,
            winningData.set,
            winningData.value,
            session,
            winningData.open_time,
            winningData.open_date
        );
        if (!saveResponse || saveResponse.code !== 200) {
            if (saveResponse.code === 400) {
                console.log("Result already processed")
                return;
            }
            return;
        }

        console.log("💾 Save success → Running payout...");

        const payoutResult = await AutoPayoutService.runAutoPayoutService(
            winningData.twod,
            session,
            currentDate
        );

        console.log("✅ Payout Response:", payoutResult);

        if (payoutResult && payoutResult.code === 200) {
            console.log("🔄 Resetting amounts...");

            const resetRes = await twoDService.resetAllNumberCurrentAmount(session);

            console.log("♻️ Reset Result:", resetRes);
        }

    } catch (err) {
        console.error("❌ Cron job error:", err);
    }
}


cron.schedule(
    "4 12 * * 1-5",
    async () => {
        console.log("⏰ 12:01 PM Cron Triggered");
        await runAutoPayoutCron("morning");
    },
    {
        timezone: "Asia/Yangon"
    }
);

cron.schedule(
    "30 16 * * 1-5",
    async () => {
        console.log("⏰ 4:31 PM Cron Triggered");
        await runAutoPayoutCron("evening");
    },
    {
        timezone: "Asia/Yangon"
    }
);

console.log("🚀 Auto payout cron started (Mon–Fri | 12:01 PM & 4:31 PM)");