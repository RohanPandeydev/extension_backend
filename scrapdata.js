const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const ScrapData = async (req, res) => {
    try {
        const { url: rawUrl, businessType } = req.body;
        const decodedUrl = String(decodeURIComponent(rawUrl)).split("?")[0];

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
        );

        await page.goto(decodedUrl, { waitUntil: "domcontentloaded" });

        const keywordData = await page.evaluate(() => {
            const stopwords = new Set([
                "the", "is", "in", "at", "which", "on", "a", "an", "and", "or", "of", "to", "for", "with", "by", "from", "it", "this", "that", "are", "was",
                "you", "your", "they", "their", "our", "we", "he", "she", "him", "her", "its", "his", "hers", "who", "what", "when", "where", "why", "how",
                "all", "any", "can", "have", "has", "had", "not", "been", "may", "will", "would", "could", "should", "but", "than"
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
                .slice(0, 50)  // Top 50 keywords
                .map(([word, count]) => ({ word, count }));

            return sortedKeywords;
        });

        // Enhanced business type mappings
        const filterKeywordsByBusinessType = (keywords, businessType) => {
            const businessMappings = {
                // Original categories with expanded keywords
                furniture: ['sofa', 'table', 'chair', 'bed', 'cabinet', 'drawer', 'shelf', 'couch', 'ottoman', 'recliner', 'dresser', 'nightstand', 'desk', 'bookcase', 'mattress', 'sectional', 'loveseat', 'armchair', 'dining', 'coffee', 'console', 'entertainment', 'storage', 'stool', 'bench', 'futon', 'wardrobe', 'vanity', 'decor', 'wood', 'leather', 'fabric', 'upholstery', 'assembly', 'delivery', 'warranty'],
                
                electronics: ['phone', 'laptop', 'computer', 'desktop', 'tablet', 'camera', 'television', 'monitor', 'speaker', 'headphone', 'earbuds', 'keyboard', 'mouse', 'printer', 'scanner', 'router', 'modem', 'gaming', 'console', 'playstation', 'xbox', 'nintendo', 'processor', 'memory', 'storage', 'ssd', 'hdd', 'usb', 'bluetooth', 'wireless', 'battery', 'charger', 'adapter', 'resolution', 'display', 'screen', 'smart', 'device', 'wearable', 'wifi', 'hdmi', 'audio', 'video'],
                
                clothing: ['shirt', 'pant', 'jean', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'hoodie', 'tshirt', 'blouse', 'top', 'bottom', 'suit', 'blazer', 'shorts', 'leggings', 'underwear', 'sock', 'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'accessory', 'hat', 'scarf', 'glove', 'belt', 'tie', 'size', 'small', 'medium', 'large', 'cotton', 'wool', 'polyester', 'leather', 'denim', 'linen', 'color', 'pattern', 'style', 'fashion', 'collection', 'seasonal'],
                
                // New categories with relevant keywords
                automotive: ['car', 'vehicle', 'auto', 'truck', 'suv', 'sedan', 'engine', 'transmission', 'brake', 'tire', 'wheel', 'oil', 'filter', 'battery', 'alternator', 'radiator', 'parts', 'accessory', 'repair', 'maintenance', 'performance', 'mileage', 'fuel', 'electric', 'hybrid', 'horsepower', 'torque', 'suspension', 'exhaust', 'interior', 'exterior', 'safety', 'warranty', 'dealer', 'used', 'new', 'model', 'make', 'year'],
                
                beauty: ['makeup', 'skincare', 'haircare', 'perfume', 'cologne', 'fragrance', 'lotion', 'moisturizer', 'cleanser', 'serum', 'foundation', 'concealer', 'lipstick', 'mascara', 'eyeshadow', 'blush', 'highlighter', 'contour', 'shampoo', 'conditioner', 'hairspray', 'gel', 'nail', 'polish', 'remover', 'brush', 'tool', 'organic', 'natural', 'vegan', 'cruelty', 'spf', 'anti', 'aging', 'hydrating', 'exfoliate', 'treatment'],
                
                grocery: ['food', 'drink', 'beverage', 'snack', 'fruit', 'vegetable', 'meat', 'dairy', 'bread', 'bakery', 'cereal', 'pasta', 'rice', 'sauce', 'oil', 'spice', 'herb', 'organic', 'fresh', 'frozen', 'canned', 'packaged', 'gluten', 'free', 'vegan', 'vegetarian', 'protein', 'carb', 'fat', 'sugar', 'salt', 'grocery', 'produce', 'aisle', 'ingredient', 'recipe', 'meal', 'prep', 'delivery'],
                
                realestate: ['house', 'home', 'property', 'apartment', 'condo', 'townhouse', 'rent', 'lease', 'buy', 'sell', 'mortgage', 'loan', 'interest', 'rate', 'down', 'payment', 'bedroom', 'bathroom', 'kitchen', 'living', 'sqft', 'acre', 'land', 'agent', 'broker', 'realtor', 'listing', 'commercial', 'residential', 'investment', 'flip', 'renovation', 'remodel', 'neighborhood', 'school', 'district', 'community', 'amenity'],
                
                travel: ['hotel', 'flight', 'airline', 'vacation', 'resort', 'booking', 'reservation', 'trip', 'tour', 'travel', 'destination', 'beach', 'mountain', 'city', 'country', 'cruise', 'accommodation', 'airport', 'ticket', 'itinerary', 'passport', 'visa', 'luggage', 'suitcase', 'package', 'all', 'inclusive', 'international', 'domestic', 'tourist', 'guide', 'adventure', 'leisure', 'business', 'miles', 'points', 'reward'],
                
                fitness: ['gym', 'workout', 'exercise', 'fitness', 'training', 'weight', 'cardio', 'strength', 'muscle', 'yoga', 'pilates', 'stretch', 'flexibility', 'equipment', 'machine', 'dumbbell', 'barbell', 'resistance', 'band', 'treadmill', 'elliptical', 'bike', 'rowing', 'protein', 'supplement', 'nutrition', 'diet', 'calorie', 'routine', 'program', 'instructor', 'trainer', 'class', 'membership', 'subscription'],
                
                technology: ['software', 'hardware', 'app', 'application', 'program', 'code', 'development', 'developer', 'programming', 'language', 'framework', 'platform', 'cloud', 'server', 'database', 'api', 'interface', 'frontend', 'backend', 'fullstack', 'mobile', 'web', 'desktop', 'security', 'encryption', 'authentication', 'user', 'experience', 'design', 'algorithm', 'data', 'analytics', 'artificial', 'intelligence', 'machine', 'learning'],
                
                healthcare: ['health', 'medical', 'doctor', 'physician', 'hospital', 'clinic', 'care', 'patient', 'treatment', 'therapy', 'medicine', 'prescription', 'drug', 'pharmaceutical', 'insurance', 'appointment', 'checkup', 'examination', 'diagnosis', 'symptom', 'condition', 'disease', 'specialist', 'primary', 'emergency', 'surgery', 'procedure', 'recovery', 'rehabilitation', 'mental', 'physical', 'wellness', 'preventive', 'chronic']
            };

            if (businessType === 'all') return keywords;

            // Filter keywords based on the business type mapping
            return keywords.filter(keyword =>
                businessMappings[businessType]?.some(item => 
                    keyword.word.includes(item) || item.includes(keyword.word)
                )
            );
        };

        const filteredKeywords = filterKeywordsByBusinessType(keywordData, businessType);

        await browser.close();

        const result = {
            url: decodedUrl,
            keywords: filteredKeywords,
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

module.exports = ScrapData;