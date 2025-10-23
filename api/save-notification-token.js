export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, url, fid } = req.body;

    if (!token || !url) {
      return res.status(400).json({ 
        error: 'Missing required fields: token, url' 
      });
    }

    // TODO: Store in database
    // For now, just log it
    console.log('📝 Saving notification token:');
    console.log('  FID:', fid);
    console.log('  Token:', token);
    console.log('  URL:', url);

    // You can store this in MongoDB:
    // const client = await clientPromise;
    // const db = client.db('arbiblocks');
    // await db.collection('notification_tokens').updateOne(
    //   { fid },
    //   { $set: { token, url, updatedAt: new Date() } },
    //   { upsert: true }
    // );

    return res.status(200).json({
      success: true,
      message: 'Notification token saved',
      fid,
      tokenPreview: token.substring(0, 10) + '...'
    });

  } catch (error) {
    console.error('Error saving notification token:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
