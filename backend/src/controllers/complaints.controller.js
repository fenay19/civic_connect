import { analyzeGrievance } from "../services/nlp.service.js";
import { getDb } from "../config/db.js";

// Helper function to convert DB row to API format
const mapDbToApi = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        text: row.text,
        language: row.language,
        location: row.location ? JSON.parse(row.location) : null,
        analysis: row.analysis ? JSON.parse(row.analysis) : null,
        status: row.status,
        assignedDepartment: row.assigned_department,
        image: row.image || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
    };
};

export const getComplaints = async (req, res) => {
    try {
        const db = await getDb();
        const data = await db.all('SELECT * FROM complaints ORDER BY created_at DESC');
        
        const complaints = data.map(mapDbToApi);
        console.log(`Returning ${complaints.length} complaints from database`);
        
        res.json(complaints);
    } catch (error) {
        console.error("Error in getComplaints:", error);
        res.status(500).json({ error: "Failed to fetch complaints" });
    }
};

export const createComplaint = async (req, res) => {
    try {
        const { text, location, language, image } = req.body;
        // In reality, user ID would come from JWT or authenticated session
        const userId = req.body.userId || null; 

        if (!text || !location) {
            return res.status(400).json({ error: "Text and location are required" });
        }

        const analysis = await analyzeGrievance(text);
        
        const db = await getDb();

        const latestRecord = await db.get('SELECT id FROM complaints ORDER BY created_at DESC LIMIT 1');

        const now = new Date();
        const year = now.getFullYear();
        
        let nextNumber = 1;
        if (latestRecord && latestRecord.id) {
            const match = latestRecord.id.match(/GRV-\d{4}-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        
        const id = `GRV-${year}-${String(nextNumber).padStart(3, "0")}`;

        const locationStr = JSON.stringify(location);
        const analysisObj = {
            ...analysis,
            confidence: analysis.confidence || 0.9,
            keywords: analysis.keywords || [],
        };
        const analysisStr = JSON.stringify(analysisObj);
        const assignedDepartment = analysis.suggestedDepartment;

        await db.run(
            `INSERT INTO complaints 
            (id, user_id, text, language, location, analysis, status, assigned_department, image, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, text, language || "en", locationStr, analysisStr, "pending", assignedDepartment, image || null, null]
        );

        const newComplaint = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
        
        res.status(201).json(mapDbToApi(newComplaint));
    } catch (error) {
        console.error("Error creating complaint:", error);
        res.status(500).json({ error: "Failed to create complaint" });
    }
};

export const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, assignedDepartment, category } = req.body;

        const db = await getDb();
        
        let updateQuery = 'UPDATE complaints SET ';
        const updateValues = [];
        
        if (status) {
            updateQuery += 'status = ?';
            updateValues.push(status);
        }
        if (notes !== undefined) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'notes = ?';
            updateValues.push(notes);
        }
        if (assignedDepartment !== undefined) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'assigned_department = ?';
            updateValues.push(assignedDepartment);
        }
        if (category) {
            const existingRow = await db.get('SELECT analysis FROM complaints WHERE id = ?', [id]);
            if (existingRow && existingRow.analysis) {
                const analysisObj = JSON.parse(existingRow.analysis);
                analysisObj.category = category;
                if (updateValues.length > 0) updateQuery += ', ';
                updateQuery += 'analysis = ?';
                updateValues.push(JSON.stringify(analysisObj));
            }
        }
        
        if (updateValues.length === 0) return res.json({});
        
        updateQuery += ' WHERE id = ?';
        updateValues.push(id);

        const result = await db.run(updateQuery, updateValues);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        const updatedRow = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
        res.json(mapDbToApi(updatedRow));
    } catch (error) {
        console.error("Error updating complaint:", error);
        res.status(500).json({ error: "Failed to update complaint" });
    }
};

export const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        
        const data = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);

        if (!data) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        res.json(mapDbToApi(data));
    } catch (error) {
        console.error("Error in getComplaintById:", error);
        res.status(500).json({ error: "Failed to fetch complaint" });
    }
};
