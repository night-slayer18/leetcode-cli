// Collaboration service - uses Supabase database for room storage
import { supabase } from './supabase.js';
import { collabStorage, type CollabSession } from '../storage/collab.js';

export { type CollabSession };

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const collabService = {
  getSession(): CollabSession | null {
    return collabStorage.getSession();
  },

  async createRoom(
    problemId: string,
    username: string
  ): Promise<{ roomCode: string } | { error: string }> {
    const roomCode = generateRoomCode();

    const { error } = await supabase.from('collab_rooms').insert({
      room_code: roomCode,
      problem_id: problemId,
      host_username: username,
      host_code: '',
      guest_username: null,
      guest_code: null,
    });

    if (error) {
      return { error: error.message };
    }

    // Save session to disk
    collabStorage.setSession({
      roomCode,
      problemId,
      isHost: true,
      username,
    });

    return { roomCode };
  },

  async joinRoom(
    roomCode: string,
    username: string
  ): Promise<{ problemId: string } | { error: string }> {
    // Check if room exists
    const { data: room, error: fetchError } = await supabase
      .from('collab_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single();

    if (fetchError || !room) {
      return { error: 'Room not found' };
    }

    // Update room with guest info
    const { error: updateError } = await supabase
      .from('collab_rooms')
      .update({ guest_username: username })
      .eq('room_code', roomCode.toUpperCase());

    if (updateError) {
      return { error: updateError.message };
    }

    // Save session to disk
    collabStorage.setSession({
      roomCode: roomCode.toUpperCase(),
      problemId: room.problem_id,
      isHost: false,
      username,
    });

    return { problemId: room.problem_id };
  },

  async syncCode(code: string): Promise<{ success: boolean; error?: string }> {
    const session = collabStorage.getSession();
    if (!session) {
      return { success: false, error: 'No active session' };
    }

    const column = session.isHost ? 'host_code' : 'guest_code';

    const { error } = await supabase
      .from('collab_rooms')
      .update({ [column]: code })
      .eq('room_code', session.roomCode);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async getPartnerCode(): Promise<{ code: string; username: string } | { error: string }> {
    const session = collabStorage.getSession();
    if (!session) {
      return { error: 'No active session' };
    }

    const { data: room, error } = await supabase
      .from('collab_rooms')
      .select('*')
      .eq('room_code', session.roomCode)
      .single();

    if (error || !room) {
      return { error: 'Room not found' };
    }

    if (session.isHost) {
      return {
        code: room.guest_code || '',
        username: room.guest_username || 'Partner',
      };
    } else {
      return {
        code: room.host_code || '',
        username: room.host_username || 'Host',
      };
    }
  },

  async getRoomStatus(): Promise<
    | { host: string; guest: string | null; hasHostCode: boolean; hasGuestCode: boolean }
    | { error: string }
  > {
    const session = collabStorage.getSession();
    if (!session) {
      return { error: 'No active session' };
    }

    const { data: room, error } = await supabase
      .from('collab_rooms')
      .select('*')
      .eq('room_code', session.roomCode)
      .single();

    if (error || !room) {
      return { error: 'Room not found' };
    }

    return {
      host: room.host_username,
      guest: room.guest_username,
      hasHostCode: !!room.host_code,
      hasGuestCode: !!room.guest_code,
    };
  },

  async leaveRoom(): Promise<void> {
    const session = collabStorage.getSession();
    if (session) {
      // Optionally delete room if host leaves
      if (session.isHost) {
        await supabase.from('collab_rooms').delete().eq('room_code', session.roomCode);
      }
    }
    collabStorage.setSession(null);
  },
};
