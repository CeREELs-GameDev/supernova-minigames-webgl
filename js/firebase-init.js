// Firebase initialization and Analytics helpers for Supernova Minigames
// Shared across landing page and game pages

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics, logEvent, setUserProperties } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCukytgMgADDUTJk_CsgFlqTX01ghJDzvE",
    authDomain: "supernova-minigames.firebaseapp.com",
    projectId: "supernova-minigames",
    storageBucket: "supernova-minigames.firebasestorage.app",
    messagingSenderId: "150940196541",
    appId: "1:150940196541:web:8aa971581bad11688161d4",
    measurementId: "G-JN5HC8N0NK"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// 접속 경로 감지: 앱 WebView vs 직접 접속
function detectSource() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("userId") || params.has("source")) {
        return params.get("source") || "app";
    }
    // WebView UA hint (앱 개발자와 협의 후 구체화)
    const ua = navigator.userAgent;
    if (ua.includes("SupernovaApp")) {
        return "app";
    }
    return "web";
}

const source = detectSource();
setUserProperties(analytics, { access_source: source });

// Analytics helper functions
export function trackGameStart(gameId) {
    logEvent(analytics, "game_start", {
        game_id: gameId,
        source: source
    });
}

export function trackGameComplete(gameId, score, playTime) {
    logEvent(analytics, "game_complete", {
        game_id: gameId,
        score: score,
        play_time: playTime,
        source: source
    });
}

export function trackGameAbandon(gameId, playTime) {
    logEvent(analytics, "game_abandon", {
        game_id: gameId,
        play_time: playTime,
        source: source
    });
}

export function trackLeaderboardView(gameId) {
    logEvent(analytics, "leaderboard_view", {
        game_id: gameId
    });
}

export function trackCustomEvent(eventName, params = {}) {
    logEvent(analytics, eventName, { ...params, source: source });
}

export { app, analytics, db, source };
