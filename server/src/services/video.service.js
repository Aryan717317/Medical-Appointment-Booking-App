const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export const createVideoRoom = async (roomName) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          max_participants: 2,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: 'cloud',
          exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
          eject_at_room_exp: true
        }
      })
    });

    if (!response.ok) {
      // Room might already exist, try to get it
      if (response.status === 400) {
        return getVideoRoom(roomName);
      }
      throw new Error('Failed to create video room');
    }

    return response.json();
  } catch (error) {
    console.error('Video room creation error:', error);
    throw error;
  }
};

export const getVideoRoom = async (roomName) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Room not found');
    }

    return response.json();
  } catch (error) {
    console.error('Get video room error:', error);
    throw error;
  }
};

export const getVideoToken = async (roomName, oderId, userName, isOwner = false) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          user_id: oderId,
          is_owner: isOwner,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create meeting token');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Video token error:', error);
    throw error;
  }
};

export const endVideoRoom = async (roomName) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete room');
    }

    return true;
  } catch (error) {
    console.error('End video room error:', error);
    throw error;
  }
};
