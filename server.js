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
        
        await page.waitForTimeout(5000); // Esperar un poco antes de buscar el botón
        
        // Intentar encontrar y hacer clic en el botón "Comienzo"
        const boton = await page.locator("button:text('Comienzo')");
        if (await boton.count() > 0) {
            console.log("✅ Botón 'Comienzo' encontrado");
            await boton.click();
        } else {
            throw new Error("El botón 'Comienzo' no está en la página");
        }
        
        // Esperar hasta que el enlace "Convertir a MP3" sea visible y clickeable
        await page.waitForSelector("a:text('Convertir a MP3')", { timeout: 60000 });
        const mp3LinkLocator = await page.locator("a:text('Convertir a MP3')");

        if (await mp3LinkLocator.count() > 0) {
            console.log("✅ Enlace 'Convertir a MP3' encontrado");
            await mp3LinkLocator.click();
        } else {
            throw new Error("Enlace 'Convertir a MP3' no encontrado");
        }

        // Ahora esperamos a que aparezca el enlace final de descarga
        await page.waitForSelector("a:has-text('Descargar MP3')", { timeout: 60000 });
        console.log("✅ Enlace 'Descargar MP3' detectado en la página");

        // Buscar el enlace de descarga real
        const downloadLinkLocator = await page.locator("a:has-text('Descargar MP3')");
        const downloadUrl = await downloadLinkLocator.getAttribute("href");

        if (!downloadUrl) {
            throw new Error("No se encontró la URL de descarga");
        }

        console.log("✅ URL de descarga obtenida:", downloadUrl);
        res.json({ status: "OK", downloadUrl });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ error: error.message });

    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.get("/", (req, res) => {
    res.json({ status: "Server running" });
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));





