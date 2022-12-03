/**
 * TimeTable 0.1 
 * 
 * This class builds the HTML time table from an Array of days ( see the markup below )
 *  based of the current date in the browser, it shows a status information, like Google does :
 * - Closed, opens Monday at 08:00
 * - Open, closes at 18:00
 * 
 * Improvements to be implemented :
 * - provide a timezone in the days object to make time comparisons effective when visiting site from other countries.
 * - refactor code to clearly separate time check logic and HTML markup construction for table and status.
 * - provide templating options for i18n and use INTL to name day labels. 
 * - as it uses a lot of ECMASCript 2015 (ES6) features ( class, findIndex, forEach... ), transpile the code for older versions of JS
*/

class HourRange {

  constructor (range, dayWeek = null) {
    this.isValid = true
    this.start = this.setTimeParts(range?.start)
    this.end = this.setTimeParts(range?.end)
    this.timeInMinutes = 0
  }

  setTimeParts(timeLabel = "12:00") {
    console.log({ timeLabel: timeLabel })
    try {
    let date = new Date()

    let parts = timeLabel.split(":");
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);

    date.setHours(hours, minutes, 0);

    let timeInMinutes = hours * 60 + minutes

    if (timeLabel.length < 5) {
      timeLabel = '0' + timeLabel
    }

    return {
      time: timeInMinutes,
      hours: hours,
      minutes: minutes,
      label: timeLabel
    };
    } catch {
      this.isValid = false
    }
  }

}

class TimeTable {

  /**
   * @constructor
   * @param {Array} days - days
   * @param {HTMLElement} tableEl - table.timetable__table
   * @param {HTMLElement} statusEl - p.timetable__header__status
   */
  constructor (params) {

    this.days = params?.days;
    if (this.days == undefined || this.days.length == 0) {
      throw new Error("days is not defined.");
    }

    this.tableEl = params?.tableEl;
    if (this.tableEl == null) {
      throw new Error("HTMLElement for table is not defined.");
    }
    
    this.statusEl = params?.statusEl;
    if (this.statusEl == null) {
      throw new Error("HTMLElement for status is not defined.");
    }

    this.currentDate = new Date();
    this.currentDay = null;
    this.currentHours = null;
    this.hoursRange = new Array();

    this.daysDisplay = new Array();

    this.buildHoursRange();
    this.displayDays();
    this.setStatus();
  }



  /**
   * write the innerHTML of table from the days
   */
  displayDays() {
    let html = "<tbody>";

    this.daysDisplay.forEach((d) => {
      console.log(d.label);
      html += `<tr class="timetable__day">
          <td class="timetable__day__label">${d.label}</td>`;
      html += `<td class="timetable__day__hours">`;
      if (d?.hours && d.hours.length >= 1) {
        d.hours.forEach((h) => {
          html += `<span>
            <time datetime="${h?.start?.label }">${h?.start?.label}</time>
            <time datetime="${h?.end?.label }">${h?.end?.label}</time>
           </span>`;
        });
      } else {
        html += ` Fermé `;
      }
      html += `</td>`;
      html += `</tr>`;
    });
    html += "</tbody>";

    // console.log(html);
    this.tableEl.innerHTML = html;
  }
  /**
   * buld a hours range from all hours existing in days
   * for finding the next hour opening easily
   */
  buildHoursRange() {

    // orderDays by dayWeek so sunday is the last day 
    let orderDays = [6, 0, 1, 2, 3, 4, 5]
    this.days = this.days.sort((a, b) => (orderDays[a?.dayWeek] > orderDays[b?.dayWeek])
      ? 1 : ((orderDays[b?.dayWeek] > orderDays[a?.dayWeek]) ? -1 : 0))

    this.days.forEach((d) => {
 
      let hoursRange = []

      // sanitize hours format so '8:00' outputs as '08:00'
      d?.hours.map(h => {
        let hourRange = new HourRange(h)
        console.log({ hourRange: hourRange })
        if (hourRange.isValid) {
          hoursRange.push(hourRange)
          return  hourRange
        }  
      })

      // console.log({ hoursRangeCreated: hoursRange })

      // sort hours asc
      hoursRange.sort((a, b) =>
        (a?.start.time > b?.start.time) ? 1
          : ((b?.start.time > a?.start.time) ? -1
            : 0))

      console.log({ hoursRangeSorted: hoursRange })

      hoursRange?.forEach((h) => {

        this.hoursRange.push({
          dayWeek: d?.dayWeek,
          label: d?.label,
          hours: h
        });
      });

      this.daysDisplay.push({
        label: d.label,
        dayWeek: d.dayWeek,
        hours: hoursRange
      }) 
      // console.log({ hours: hours })
    });

    debugger


    console.log({ hoursRange: this.hoursRange });
    console.log({ days: this.days });
  }

  /**
   * Display the status message
   */
  setStatus() {
    let message = "";

    let isOpen = this.checkisOpen();
    message += isOpen ? "&check; Ouvert" : "&cross; Fermé";

    let hourRangeIndex = this.getHourRangeIndex();
    console.log({
      hourRangeIndex: hourRangeIndex,
      currentHour: this.hoursRange[hourRangeIndex]
    });
    if (isOpen) {
      message += ` - Ferme à ${this.hoursRange[hourRangeIndex].hours?.end?.label} `;
    } else {

      hourRangeIndex = (hourRangeIndex + 1) % this.hoursRange.length;

      for (let i = hourRangeIndex; i < this.hoursRange.length; i++) {

        let hours = this.hoursRange[i];

        if (hours?.hours?.start) {
          message += ` - Ouvre ${hours?.label} à ${hours?.hours?.start?.label}`;
          break;
        }
      }
    }

    this.statusEl.innerHTML = message;
  }

  /**
   * get the index the current hours in hoursRange
   * @returns {Integer} startIndexhoursRange
   */
  getHourRangeIndex() {
    if (this.currentHours == null || this.currentHours == undefined) {
      throw new Error(
        "no hours are not defined. Please check the format of the days Array."
      );
    }

    let startIndexhoursRange = this.hoursRange.findIndex((h) => {
      console.log({
        dayWeek: h.dayWeek,
        start: h.hours?.start,
        end: h.hours?.end
      });

      return (
        h?.dayWeek == this.currentDay?.dayWeek &&
        h?.hours?.start == this.currentHours?.start &&
        h?.hours.end === this.currentHours?.end
      );
    });

    return startIndexhoursRange;
  }

  /**
   * check if the current Datetime match opening hours in days list
   * @returns {Boolean} isOpen
   */
  checkisOpen() {
    let time = this.currentDate.getTime();
    let dayWeek = this.currentDate.getDay();

    let isOpen = false,
      startTime = null,
      endTime = null;

    let currentDayIndex = this.daysDisplay.findIndex((d) => d.dayWeek == dayWeek);

    this.currentDay = this.daysDisplay[currentDayIndex];

    for (let i = 0; i < this.currentDay?.hours?.length; i++) {
      this.currentHours = this.currentDay?.hours[i];

      startTime = this.setTimeParts(
        new Date(),
        this.currentHours?.start
      ).getTime();

      endTime = this.setTimeParts(new Date(), this.currentHours?.end).getTime();

      if (time >= startTime && time <= endTime) {
        isOpen = true;

        break;
      }
    }
    console.log({
      isOpen,
      startTime,
      endTime
    });
    return isOpen;
  }


  /**
 * Helper for setting hours & minutes of a Date
 * @param {Date} date - date
 * @param {string} time - a time formatted like 'hh:mm'
 * @returns {Date} with hours & minutes
 */
  setTimeParts(date = new Date(), time = "12:00") {
    let parts = time.split(":");
    console.log(time, parts);
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    date.setHours(hours, minutes, 0);
    return date;
  }
}


/**
 * usage
 *
 */
// const timetable_status = document.querySelector("#timetable_status");
// const timetable_table = document.querySelector("table#timetable_table");

// // JSON Object, could be provided from an API
// const days = [
//   {
//     dayWeek: 1,
//     label: "Lundi",
//     hours: [{ start: "8:00", end: "19:00" }]
//   },
 
//   {
//     dayWeek: 6,
//     label: "Samedi",
//     hours: [
//       { start: "8:00", end: "13:00" },
//       { start: "15:00", end: "19:00" }
//     ]
//   },

//   {
//     dayWeek: 0,
//     label: "Dimanche",
//     hours: []
//   }
// ];


//  new TimeTable({
//   tableEl: timetable_table,
//   statusEl: timetable_status,
//   days: days
// });
