const express = require("express");
const { chromium } = require("playwright");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post("/ejecutar", async (req, res) => {
    console.log("Recibida petición:", req.body);
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ error: "Falta videoId" });

    let browser;
    try {
        browser = await chromium.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        const url = `https://www.savethevideo.com/es/converter?url=www.dailymotion.com%2Fvideo%2F${videoId}`;
        await page.goto(url, { waitUntil: "networkidle" });
        
        await page.locator("button:text('Comienzo')").click().catch(() => {
            console.log("Error o botón no encontrado");
        });
        
        await page.waitForSelector("a:text('Convertir a MP3')", { timeout: 30000 });
        const downloadUrl = await page.locator("a:text('Convertir a MP3')").getAttribute("href");
        
        await browser.close();
        
        if (!downloadUrl) {
            return res.status(500).json({ error: "No se encontró el enlace de descarga" });
        }
        
        res.json({ status: "OK", downloadUrl });
    } catch (error) {
        console.error("Error:", error);
        if (browser) await browser.close();
        res.status(500).json({ error: error.message });
    }
});

app.get("/", (req, res) => {
    res.json({ status: "Server running" });
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
