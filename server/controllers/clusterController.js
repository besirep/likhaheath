const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        fc.*,
        p.first_name AS head_first_name,
        p.last_name AS head_last_name,
        s.first_name AS creator_first_name,
        s.last_name AS creator_last_name,
        (SELECT COUNT(*) FROM patients p2 WHERE p2.family_cluster_id = fc.id) AS member_count
      FROM family_clusters fc
      LEFT JOIN patients p ON fc.head_patient_id = p.id
      LEFT JOIN staff s ON fc.created_by_staff_id = s.id
    `;
    
    let queryParams = [];
    
    if (search) {
      query += ` WHERE fc.label LIKE ? OR p.last_name LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY fc.label ASC`;
    
    const [clusters] = await db.query(query, queryParams);
    
    const formattedClusters = clusters.map(c => ({
      ...c,
      head_name: c.head_patient_id ? `${c.head_first_name} ${c.head_last_name}` : 'None Assigned',
      creator_name: c.created_by_staff_id ? `${c.creator_first_name} ${c.creator_last_name}` : 'Unknown'
    }));
    
    res.json(formattedClusters);
  } catch (error) {
    console.error('[clusterController.getAll]', error);
    res.status(500).json({ message: 'Failed to retrieve clusters' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [clusters] = await db.query(`
      SELECT fc.*, p.first_name AS head_first_name, p.last_name AS head_last_name
      FROM family_clusters fc
      LEFT JOIN patients p ON fc.head_patient_id = p.id
      WHERE fc.id = ?
    `, [id]);
    
    if (clusters.length === 0) {
      return res.status(404).json({ message: 'Cluster not found' });
    }
    
    const cluster = clusters[0];
    cluster.head_name = cluster.head_patient_id ? `${cluster.head_first_name} ${cluster.head_last_name}` : 'None Assigned';
    
    // Get all members
    const [members] = await db.query(`
      SELECT id, first_name, last_name, date_of_birth, sex_id, philhealth_no
      FROM patients
      WHERE family_cluster_id = ?
      ORDER BY date_of_birth ASC
    `, [id]);
    
    cluster.members = members;
    
    res.json(cluster);
  } catch (error) {
    console.error('[clusterController.getOne]', error);
    res.status(500).json({ message: 'Failed to retrieve cluster details' });
  }
};

exports.create = async (req, res) => {
  try {
    const { label, notes, head_patient_id } = req.body;
    
    if (!label) {
      return res.status(400).json({ message: 'Cluster label is required' });
    }
    
    // We assume the user creates it within their health center
    // We can extract staff_id from req.user if auth middleware is properly setting it
    // For now, assuming staff_id is passed or using a default. Let's try to get from req.user if it exists, else default to 1 (Admin) for testing
    const created_by_staff_id = req.user?.staff_id || req.body.staff_id || 1;
    const health_center_id = 1; // Defaulting to 1 for Phase 1
    
    const [result] = await db.query(`
      INSERT INTO family_clusters (label, head_patient_id, health_center_id, created_by_staff_id, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [label, head_patient_id || null, health_center_id, created_by_staff_id, notes || null]);
    
    res.status(201).json({ id: result.insertId, message: 'Cluster created successfully' });
  } catch (error) {
    console.error('[clusterController.create]', error);
    res.status(500).json({ message: 'Failed to create cluster' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, notes, head_patient_id } = req.body;
    
    await db.query(`
      UPDATE family_clusters 
      SET label = ?, notes = ?, head_patient_id = ?
      WHERE id = ?
    `, [label, notes, head_patient_id || null, id]);
    
    res.json({ message: 'Cluster updated successfully' });
  } catch (error) {
    console.error('[clusterController.update]', error);
    res.status(500).json({ message: 'Failed to update cluster' });
  }
};

exports.addPatient = async (req, res) => {
  try {
    const { id, patientId } = req.params;
    
    // Verify patient exists
    const [patient] = await db.query('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (patient.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    await db.query('UPDATE patients SET family_cluster_id = ? WHERE id = ?', [id, patientId]);
    
    res.json({ message: 'Patient added to cluster' });
  } catch (error) {
    console.error('[clusterController.addPatient]', error);
    res.status(500).json({ message: 'Failed to add patient to cluster' });
  }
};

exports.removePatient = async (req, res) => {
  try {
    const { id, patientId } = req.params;
    
    // If the patient is the head of the cluster, we should probably nullify the head_patient_id
    const [cluster] = await db.query('SELECT head_patient_id FROM family_clusters WHERE id = ?', [id]);
    if (cluster.length > 0 && cluster[0].head_patient_id == patientId) {
      await db.query('UPDATE family_clusters SET head_patient_id = NULL WHERE id = ?', [id]);
    }
    
    await db.query('UPDATE patients SET family_cluster_id = NULL WHERE id = ?', [patientId]);
    
    res.json({ message: 'Patient removed from cluster' });
  } catch (error) {
    console.error('[clusterController.removePatient]', error);
    res.status(500).json({ message: 'Failed to remove patient from cluster' });
  }
};
