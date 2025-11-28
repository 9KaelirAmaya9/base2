/**
 * Google Calendar Service
 * Handles all Google Calendar API operations
 */

const { google } = require('googleapis');
const BaseWorkspaceService = require('./BaseWorkspaceService');

class CalendarService extends BaseWorkspaceService {
  constructor() {
    super(['https://www.googleapis.com/auth/calendar']);
    this.calendar = null;
  }

  /**
   * Initialize Calendar service
   * @param {string} userEmail - User email for delegation
   */
  async initialize(userEmail = null) {
    await super.initialize(userEmail);
    const authClient = await this.auth.getClient();
    this.calendar = google.calendar({ version: 'v3', auth: authClient });
    return this;
  }

  /**
   * Create a calendar event
   * @param {object} eventData - Event data
   * @param {string} calendarId - Calendar ID (default: 'primary')
   */
  async createEvent(eventData, calendarId = 'primary') {
    this.ensureInitialized();
    this.logApiCall('Calendar', 'createEvent', { summary: eventData.summary });

    try {
      const result = await this.retry(async () => {
        return await this.calendar.events.insert({
          calendarId,
          requestBody: eventData,
        });
      });

      return {
        id: result.data.id,
        summary: result.data.summary,
        start: result.data.start,
        end: result.data.end,
        htmlLink: result.data.htmlLink,
        hangoutLink: result.data.hangoutLink,
      };
    } catch (error) {
      this.handleError(error, 'createEvent');
    }
  }

  /**
   * Get an event by ID
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (default: 'primary')
   */
  async getEvent(eventId, calendarId = 'primary') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.events.get({
          calendarId,
          eventId,
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'getEvent');
    }
  }

  /**
   * List events
   * @param {object} options - Query options
   * @param {string} calendarId - Calendar ID (default: 'primary')
   */
  async listEvents(options = {}, calendarId = 'primary') {
    this.ensureInitialized();

    try {
      const params = {
        calendarId,
        maxResults: options.maxResults || 100,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (options.timeMin) params.timeMin = options.timeMin;
      if (options.timeMax) params.timeMax = options.timeMax;
      if (options.q) params.q = options.q;

      const result = await this.retry(async () => {
        return await this.calendar.events.list(params);
      });

      return result.data.items || [];
    } catch (error) {
      this.handleError(error, 'listEvents');
    }
  }

  /**
   * Update an event
   * @param {string} eventId - Event ID
   * @param {object} updates - Updated event data
   * @param {string} calendarId - Calendar ID (default: 'primary')
   */
  async updateEvent(eventId, updates, calendarId = 'primary') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.events.patch({
          calendarId,
          eventId,
          requestBody: updates,
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'updateEvent');
    }
  }

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (default: 'primary')
   */
  async deleteEvent(eventId, calendarId = 'primary') {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.calendar.events.delete({
          calendarId,
          eventId,
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'deleteEvent');
    }
  }

  /**
   * Get upcoming events
   * @param {number} days - Number of days ahead
   * @param {number} maxResults - Maximum results
   * @param {string} calendarId - Calendar ID
   */
  async getUpcomingEvents(days = 7, maxResults = 50, calendarId = 'primary') {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return await this.listEvents(
      {
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        maxResults,
      },
      calendarId
    );
  }

  /**
   * Get events for today
   * @param {string} calendarId - Calendar ID
   */
  async getTodayEvents(calendarId = 'primary') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await this.listEvents(
      {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
      },
      calendarId
    );
  }

  /**
   * Create a quick event (simple text input)
   * @param {string} text - Quick event text (e.g., "Meeting tomorrow at 3pm")
   * @param {string} calendarId - Calendar ID
   */
  async quickAddEvent(text, calendarId = 'primary') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.events.quickAdd({
          calendarId,
          text,
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'quickAddEvent');
    }
  }

  /**
   * Create meeting with Google Meet link
   * @param {object} eventData - Event data
   * @param {string} calendarId - Calendar ID
   */
  async createMeeting(eventData, calendarId = 'primary') {
    eventData.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };

    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.events.insert({
          calendarId,
          conferenceDataVersion: 1,
          requestBody: eventData,
        });
      });

      return {
        id: result.data.id,
        summary: result.data.summary,
        start: result.data.start,
        end: result.data.end,
        htmlLink: result.data.htmlLink,
        hangoutLink: result.data.hangoutLink,
        meetLink: result.data.conferenceData?.entryPoints?.[0]?.uri,
      };
    } catch (error) {
      this.handleError(error, 'createMeeting');
    }
  }

  /**
   * Add attendees to event
   * @param {string} eventId - Event ID
   * @param {Array} attendees - Array of {email, displayName, optional} objects
   * @param {string} calendarId - Calendar ID
   */
  async addAttendees(eventId, attendees, calendarId = 'primary') {
    const event = await this.getEvent(eventId, calendarId);

    const existingAttendees = event.attendees || [];
    const updatedAttendees = [...existingAttendees, ...attendees];

    return await this.updateEvent(
      eventId,
      { attendees: updatedAttendees },
      calendarId
    );
  }

  /**
   * Set event reminder
   * @param {string} eventId - Event ID
   * @param {Array} reminders - Array of {method, minutes} objects
   * @param {string} calendarId - Calendar ID
   */
  async setReminders(eventId, reminders, calendarId = 'primary') {
    return await this.updateEvent(
      eventId,
      {
        reminders: {
          useDefault: false,
          overrides: reminders,
        },
      },
      calendarId
    );
  }

  /**
   * Check free/busy time
   * @param {Array} emails - Array of email addresses to check
   * @param {Date} timeMin - Start time
   * @param {Date} timeMax - End time
   */
  async checkFreeBusy(emails, timeMin, timeMax) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.freebusy.query({
          requestBody: {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            items: emails.map((email) => ({ id: email })),
          },
        });
      });

      return result.data.calendars;
    } catch (error) {
      this.handleError(error, 'checkFreeBusy');
    }
  }

  /**
   * Find available meeting times
   * @param {Array} attendees - Attendee emails
   * @param {number} duration - Meeting duration in minutes
   * @param {Date} searchStart - Start of search window
   * @param {Date} searchEnd - End of search window
   */
  async findAvailableSlots(attendees, duration, searchStart, searchEnd) {
    const freeBusy = await this.checkFreeBusy(attendees, searchStart, searchEnd);

    const availableSlots = [];
    let currentTime = new Date(searchStart);
    const endTime = new Date(searchEnd);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      // Check if this slot is free for all attendees
      let isFree = true;
      for (const email of attendees) {
        const busyTimes = freeBusy[email]?.busy || [];
        for (const busy of busyTimes) {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);

          if (
            (currentTime >= busyStart && currentTime < busyEnd) ||
            (slotEnd > busyStart && slotEnd <= busyEnd)
          ) {
            isFree = false;
            break;
          }
        }
        if (!isFree) break;
      }

      if (isFree) {
        availableSlots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      // Move to next 30-minute slot
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    return availableSlots;
  }

  /**
   * Create recurring event
   * @param {object} eventData - Event data
   * @param {object} recurrence - Recurrence rule (e.g., {freq: 'WEEKLY', interval: 1, count: 10})
   * @param {string} calendarId - Calendar ID
   */
  async createRecurringEvent(eventData, recurrence, calendarId = 'primary') {
    const rrule = this.buildRRule(recurrence);
    eventData.recurrence = [rrule];

    return await this.createEvent(eventData, calendarId);
  }

  /**
   * Build RRULE string
   * @param {object} recurrence - Recurrence config
   */
  buildRRule(recurrence) {
    let rrule = `RRULE:FREQ=${recurrence.freq}`;

    if (recurrence.interval) rrule += `;INTERVAL=${recurrence.interval}`;
    if (recurrence.count) rrule += `;COUNT=${recurrence.count}`;
    if (recurrence.until) rrule += `;UNTIL=${recurrence.until}`;
    if (recurrence.byDay) rrule += `;BYDAY=${recurrence.byDay.join(',')}`;
    if (recurrence.byMonthDay) rrule += `;BYMONTHDAY=${recurrence.byMonthDay}`;

    return rrule;
  }

  /**
   * List all calendars
   */
  async listCalendars() {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.calendarList.list();
      });

      return result.data.items || [];
    } catch (error) {
      this.handleError(error, 'listCalendars');
    }
  }

  /**
   * Create a new calendar
   * @param {string} summary - Calendar name
   * @param {string} description - Calendar description
   * @param {string} timeZone - Time zone
   */
  async createCalendar(summary, description = '', timeZone = 'America/New_York') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.calendars.insert({
          requestBody: {
            summary,
            description,
            timeZone,
          },
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'createCalendar');
    }
  }

  /**
   * Watch calendar for changes (requires Pub/Sub setup)
   * @param {string} calendarId - Calendar ID
   */
  async watchCalendar(calendarId = 'primary') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.calendar.events.watch({
          calendarId,
          requestBody: {
            id: `calendar-watch-${Date.now()}`,
            type: 'web_hook',
            address: process.env.CALENDAR_WEBHOOK_URL,
          },
        });
      });

      return {
        resourceId: result.data.resourceId,
        expiration: result.data.expiration,
      };
    } catch (error) {
      this.handleError(error, 'watchCalendar');
    }
  }
}

module.exports = CalendarService;
