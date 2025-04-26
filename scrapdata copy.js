const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const ScrapData = async (req, res) => {
    try {
        const { url: rawUrl } = req.body;
        const decodedUrl = String(decodeURIComponent(rawUrl)).split("?")[0];

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
        );

        await page.goto(decodedUrl, { waitUntil: "domcontentloaded" });

        const keywordData = await page.evaluate(() => {
            const stopwords = new Set([
                "the", "is", "in", "at", "which", "on", "a", "an", "and", "or", "of", "to", "for", "with", "by", "from", "it", "this", "that", "are", "was"
            ]);

            const text = document.body.innerText || "";
            const words = text
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .split(/\s+/)
                .filter(word => word.length > 2 && !stopwords.has(word));

            const frequency = {};
            for (const word of words) {
                frequency[word] = (frequency[word] || 0) + 1;
            }

            const sortedKeywords = Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50) // top 50 keywords
                .map(([word, count]) => ({ word, count }));

            return sortedKeywords;
        });

        await browser.close();

        const result = {
            url: decodedUrl,
            keywords: keywordData,
        };

        const fileName = `extracted_keywords_${Date.now()}.json`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

        return res.json({ success: true, filePath, result });
    } catch (error) {
        console.error("Keyword extraction failed:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};


module.exports = ScrapData




