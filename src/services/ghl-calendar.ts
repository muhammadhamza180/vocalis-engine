import { GHLCalendarBookRequest, GHLCalendarBookResponse, GHLCalendarCheckRequest, GHLCalendarCheckResponse } from '../types';

export class GHLCalendarService {
  private bookedSlots: Set<string> = new Set([
    '2026-09-04T14:00:00+10:00',
    '2026-09-04T15:30:00+10:00',
    '2026-09-05T10:00:00+10:00',
  ]);

  public async checkAvailability(req: GHLCalendarCheckRequest): Promise<GHLCalendarCheckResponse> {
    const baseSlots = [
      `${req.date}T09:00:00+10:00`,
      `${req.date}T10:00:00+10:00`,
      `${req.date}T11:30:00+10:00`,
      `${req.date}T14:00:00+10:00`,
      `${req.date}T16:00:00+10:00`,
    ];

    const available = baseSlots.filter(slot => !this.bookedSlots.has(slot));

    return {
      available_slots: available,
      timezone: req.timezone || 'Australia/Melbourne',
      date: req.date,
      status: available.length > 0 ? 'available' : 'conflict',
    };
  }

  public async bookAppointment(req: GHLCalendarBookRequest): Promise<GHLCalendarBookResponse> {
    if (this.bookedSlots.has(req.slot_time)) {
      return {
        success: false,
        slot_time: req.slot_time,
        prospect_email: req.prospect_email,
        message: `Time slot ${req.slot_time} is no longer available. Available alternate slots: ${this.suggestAlternativeSlots(req.slot_time).join(', ')}`,
      };
    }

    this.bookedSlots.add(req.slot_time);
    const appointmentId = `ghl_apt_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      appointment_id: appointmentId,
      slot_time: req.slot_time,
      prospect_email: req.prospect_email,
      message: `Appointment successfully scheduled for ${req.prospect_name} at ${req.slot_time}. Calendar invite dispatched to ${req.prospect_email}.`,
    };
  }

  public suggestAlternativeSlots(occupiedSlot: string): string[] {
    const datePart = occupiedSlot.split('T')[0];
    return [
      `${datePart}T10:00:00+10:00`,
      `${datePart}T14:30:00+10:00`,
      `${datePart}T16:00:00+10:00`,
    ].filter(s => !this.bookedSlots.has(s));
  }
}

export const ghlCalendar = new GHLCalendarService();
