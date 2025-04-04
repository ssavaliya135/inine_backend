// import moment from "moment";

// export const calculateMonth = (date) => {
//   const currentDate = moment(date, "DD/MM/YYYY");

//   const formatter = new Intl.DateTimeFormat("en", { month: "short" });

//   const currentMonth = formatter.format(currentDate.toDate());
//   const currentYear = currentDate.year();

//   // Get the previous month
//   const previousMonthDate = moment(currentDate).subtract(1, "month");
//   const previousMonth = formatter.format(previousMonthDate.toDate());
//   const previousMonthYear = previousMonthDate.year();

//   const lastFridayPreviousMonth = getLastFriday(previousMonthDate);
//   const lastThursdayCurrentMonth = getLastThursday(currentDate);

//   let month;
//   if (currentDate.isSameOrBefore(lastThursdayCurrentMonth)) {
//     if (currentYear === previousMonthYear) {
//       month = `${previousMonth}-${currentMonth} (${currentYear})`;
//     } else {
//       month = `${previousMonth}-${currentMonth} (${previousMonthYear}-${currentYear
//         .toString()
//         .slice(2)})`;
//     }
//   } else {
//     const nextMonthDate = moment(currentDate).add(1, "month");
//     const nextMonth = formatter.format(nextMonthDate.toDate());
//     const nextMonthYear = nextMonthDate.year();

//     if (currentYear === nextMonthYear) {
//       month = `${currentMonth}-${nextMonth} (${currentYear})`;
//     } else {
//       month = `${currentMonth}-${nextMonth} (${currentYear}-${nextMonthYear
//         .toString()
//         .slice(2)})`;
//     }
//   }

//   return {
//     currentDate: currentDate.toDate(),
//     lastFridayPreviousMonth,
//     lastThursdayCurrentMonth,
//     month,
//   };
// };

// function getLastFriday(date) {
//   let lastDayOfMonth = moment(date).endOf("month");
//   let lastThursday = getLastThursday(date);
//   console.log(lastThursday, "+++++++++");
//   if (lastThursday.date() === lastDayOfMonth.date()) {
//     console.log(
//       moment(date).add(1, "month").startOf("month"),
//       "------------------"
//     );

//     return moment(date).add(1, "month").startOf("month");
//   } else {
//     // Find the last Friday
//     while (lastDayOfMonth.day() !== 5) {
//       lastDayOfMonth.subtract(1, "day");
//     }
//     console.log(lastDayOfMonth, "!!!!!!!!!!!!!!!!!!!");

//     return lastDayOfMonth;
//   }
// }

// function getLastThursday(date) {
//   console.log(date, "#######");

//   let lastDayOfMonth = moment(date).endOf("month");
//   console.log(lastDayOfMonth.date(), "&&&&&&");

//   let lastDay = moment(date).endOf("month");
//   // Check if the last day is Thursday, if not find the last Thursday
//   if (lastDayOfMonth.day() !== 4) {
//     while (lastDayOfMonth.day() !== 4) {
//       lastDayOfMonth.subtract(1, "day");
//     }
//   }

//   // Check if the last Thursday is at the end of the month
//   const lastThursday = lastDayOfMonth.clone();
//   console.log(
//     lastThursday.date(),
//     lastDayOfMonth.date(),
//     lastDay.date(),
//     ">>>>>>>>>"
//   );

//   if (lastThursday.date() === lastDay.date()) {
//     // lastThursday.subtract(1, "day");
//     // while (lastThursday.day() !== 4) {
//     //   lastThursday.subtract(1, "day");
//     // }
//   }

//   console.log(lastThursday, "********");
//   return lastThursday;
// }

// export const calculateTotalDays = (date) => {
//   let { lastFridayPreviousMonth, lastThursdayCurrentMonth, month } =
//     calculateMonth(date);
//   console.log(lastFridayPreviousMonth, lastThursdayCurrentMonth, month);

//   const totalDays =
//     lastThursdayCurrentMonth.diff(lastFridayPreviousMonth, "days") + 1;
//   return { totalDays, month };
// };

import moment from "moment";

export const calculateMonth = (date) => {
  date = moment(date).format("DD/MM/YYYY");
  const currentDate = moment(date, "DD/MM/YYYY");
  let current = moment(date, "DD/MM/YYYY");
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });

  const currentMonth = formatter.format(currentDate.toDate());
  const currentYear = currentDate.year();

  // Get the previous month
  const previousMonthDate = moment(currentDate).subtract(1, "month");
  const previousMonth = formatter.format(previousMonthDate.toDate());
  const previousMonthYear = previousMonthDate.year();

  const nextMonthDate = moment(currentDate).add(1, "month");
  const nextMonth = formatter.format(nextMonthDate.toDate());
  const nextMonthYear = nextMonthDate.year();

  let lastFridayPreviousMonth = getLastFriday(previousMonthDate);
  let lastFridayCurrentMonth = getLastFriday(currentDate);
  let lastThursdayCurrentMonth = getLastThursday(currentDate);
  let lastThursdayOfPreviousMonth = getLastThursday(previousMonthDate);
  let lastThursdayOfNextMonth = getLastThursday(current.add(1, "month"));
  console.log(
    lastFridayPreviousMonth,
    lastThursdayCurrentMonth,
    lastThursdayOfPreviousMonth.date(),
    previousMonthDate.endOf("month").date(),
    currentDate.startOf("month"),
    current.date(),
    "???????"
  );
  console.log(current.date() <= lastThursdayCurrentMonth.date(), "@@@@");

  let month;
  if (
    lastThursdayOfPreviousMonth.date() ==
      previousMonthDate.endOf("month").date() &&
    current.date() <= lastThursdayCurrentMonth.date()
  ) {
    console.log("***********************");

    month = `${currentMonth} (${currentYear})`;
    lastFridayPreviousMonth = currentDate.startOf("month");
  } else if (current.date() > lastThursdayCurrentMonth.date()) {
    lastFridayPreviousMonth = lastFridayCurrentMonth;
    lastThursdayCurrentMonth = lastThursdayOfNextMonth;
    if (currentYear === nextMonthYear) {
      month = `${nextMonth} (${currentYear})`;
    } else {
      month = `${nextMonth} (${currentYear}-${nextMonthYear
        .toString()
        .slice(2)})`;
    }
    // if (currentYear === nextMonthYear) {
    //   month = `${currentMonth}-${nextMonth} (${currentYear})`;
    // } else {
    //   month = `${currentMonth}-${nextMonth} (${currentYear}-${nextMonthYear
    //     .toString()
    //     .slice(2)})`;
    // }
  } else if (
    current.isSameOrBefore(lastThursdayCurrentMonth) ||
    currentDate.isSameOrBefore(lastThursdayCurrentMonth)
  ) {
    console.log("!!!!!!!!!!!!!!!!!");

    if (currentYear === previousMonthYear) {
      month = `${currentMonth} (${currentYear})`;
    } else {
      month = `${currentMonth} (${previousMonthYear}-${currentYear
        .toString()
        .slice(2)})`;
    }
    // if (currentYear === previousMonthYear) {
    //   month = `${previousMonth}-${currentMonth} (${currentYear})`;
    // } else {
    //   month = `${previousMonth}-${currentMonth} (${previousMonthYear}-${currentYear
    //     .toString()
    //     .slice(2)})`;
    // }
  } else {
    const nextMonthDate = moment(currentDate).add(1, "month");
    const nextMonth = formatter.format(nextMonthDate.toDate());
    const nextMonthYear = nextMonthDate.year();

    if (currentYear === nextMonthYear) {
      month = `${nextMonth} (${currentYear})`;
    } else {
      month = `${nextMonth} (${currentYear}-${nextMonthYear
        .toString()
        .slice(2)})`;
    }
    // if (currentYear === nextMonthYear) {
    //   month = `${currentMonth}-${nextMonth} (${currentYear})`;
    // } else {
    //   month = `${currentMonth}-${nextMonth} (${currentYear}-${nextMonthYear
    //     .toString()
    //     .slice(2)})`;
    // }
  }

  return {
    currentDate: currentDate.toDate(),
    lastFridayPreviousMonth,
    lastThursdayCurrentMonth,
    month,
  };
};

function getLastFriday(date) {
  let lastDayOfMonth = moment(date).endOf("month");

  // Find the last Friday
  while (lastDayOfMonth.day() !== 5) {
    lastDayOfMonth.subtract(1, "day");
  }
  return lastDayOfMonth;
}

function getLastThursday(date) {
  let lastDayOfMonth = moment(date).endOf("month");

  // Find the last Thursday
  while (lastDayOfMonth.day() !== 4) {
    lastDayOfMonth.subtract(1, "day");
  }
  return lastDayOfMonth;
}

export const calculateTotalDays = (date) => {
  let { lastFridayPreviousMonth, lastThursdayCurrentMonth, month } =
    calculateMonth(date);
  console.log(
    lastFridayPreviousMonth,
    lastThursdayCurrentMonth,
    month,
    "^^^^^^^^^^^^"
  );

  const totalDays =
    lastThursdayCurrentMonth.diff(lastFridayPreviousMonth, "days") + 1;
  return {
    totalDays,
    month,
    lastFridayPreviousMonth,
    lastThursdayCurrentMonth,
  };
};

export const calculateROI = (capital, pnl) => {
  let ROI = (pnl / capital) * 100;
  return ROI;
};

// export const overallPNL = (
//   pnlList,
//   lastFridayPreviousMonth,
//   lastThursdayCurrentMonth
// ) => {
//   const today = moment().startOf("day");
//   const startOfWeek = moment().startOf("week").subtract(1, "day");
//   const endOfWeek = moment().endOf("week");
//   const currentMonthStart = moment(lastFridayPreviousMonth).subtract(2, "day");
//   const currentMonthEnd = moment(lastThursdayCurrentMonth);
//   console.log(currentMonthStart, currentMonthEnd, "??????????????/");
//   let totals = pnlList.reduce(
//     (acc, item, index) => {
//       const itemDate = moment(item.date, "DD/MM/YYYY");
//       acc.totalPnlValue += item.pnlValue;
//       acc.totalROI += item.ROI;

//       // Update latest profit/loss and max profit
//       if (item.pnlValue >= 0) {
//         acc.latestProfit = item.pnlValue;
//         if (item.pnlValue > acc.latestMaxProfit) {
//           acc.latestMaxProfit = item.pnlValue;
//         }
//       } else {
//         acc.latestLoss = item.pnlValue;
//       }

//       // Calculate DD and MDD
//       if (index === 0) {
//         acc.DD = 0;
//         acc.MDD = 0;
//       } else {
//         const currentDD = acc.latestMaxProfit - item.pnlValue;
//         acc.DD = currentDD;
//         if (currentDD > acc.MDD) {
//           acc.MDD = currentDD;
//         }
//       }

//       // Reset DD and MDD if new max profit is reached
//       if (item.pnlValue > acc.latestMaxProfit) {
//         acc.DD = 0;
//         acc.MDD = 0;
//       }

//       // Other calculations remain the same
//       if (item.pnlValue > 0) {
//         acc.winDays++;
//         acc.totalWinProfit += item.pnlValue;
//         acc.currentWinStreak++;
//         acc.currentLossStreak = 0;
//         if (acc.currentWinStreak > acc.maxWinStreak) {
//           acc.maxWinStreak = acc.currentWinStreak;
//         }
//         if (item.pnlValue > acc.maxProfit) {
//           acc.maxProfit = item.pnlValue;
//         }
//       } else {
//         acc.lossDays++;
//         acc.totalLoss += item.pnlValue;
//         acc.currentLossStreak++;
//         acc.currentWinStreak = 0;
//         if (acc.currentLossStreak > acc.maxLossStreak) {
//           acc.maxLossStreak = acc.currentLossStreak;
//         }
//         if (item.pnlValue < acc.maxLoss) {
//           acc.maxLoss = item.pnlValue;
//         }
//       }

//       // Calculate today's PnL
//       if (itemDate.isSame(today, "day")) {
//         acc.todayPNL += item.pnlValue;
//       }
//       // Calculate current week's PnL
//       console.log(startOfWeek, ">>>>>>>>>>>", endOfWeek);

//       if (itemDate.isAfter(startOfWeek) && itemDate.isBefore(endOfWeek)) {
//         console.log("inside week if cndition", acc.currentWeekPNL);

//         acc.currentWeekPNL += item.pnlValue;
//         console.log("inside week if cnditionnnnnnnnnnn", acc.currentWeekPNL);
//       }
//       // Calculate current month's PnL
//       // if (itemDate.isBetween(currentMonthStart, currentMonthEnd, null, "[]")) {
//       //   acc.currentMonthPNL += item.pnlValue;
//       // }

//       if (
//         itemDate.isAfter(currentMonthStart) &&
//         itemDate.isBefore(currentMonthEnd)
//       ) {
//         console.log("inside ifffffff", itemDate);
//         console.log("insidd", acc.currentMonthPNL);
//         console.log("@@@@", item.pnlValue);

//         acc.currentMonthPNL += item.pnlValue;
//         console.log(">>>>>>>>>", acc.currentMonthPNL);
//       }

//       return acc;
//     },
//     {
//       totalPnlValue: 0,
//       totalROI: 0,
//       winDays: 0,
//       lossDays: 0,
//       totalWinProfit: 0,
//       totalLoss: 0,
//       maxProfit: -Infinity,
//       maxLoss: 0,
//       currentWinStreak: 0,
//       maxWinStreak: 0,
//       currentLossStreak: 0,
//       maxLossStreak: 0,
//       latestProfit: 0,
//       latestLoss: 0,
//       todayPNL: 0,
//       currentWeekPNL: 0,
//       currentMonthPNL: 0,
//       latestMaxProfit: -Infinity,
//       DD: 0,
//       MDD: 0,
//     }
//   );

//   return totals;
// };

export const overallPNL = (
  pnlList,
  lastFridayPreviousMonth,
  lastThursdayCurrentMonth,
  latestMDD
) => {
  console.log("djfehfsf!!!!!!!!!!!!!!!!!!!!!fkjgrj==========", latestMDD);

  const today = moment().startOf("day");
  const startOfWeek = moment().startOf("week").subtract(1, "day");
  const endOfWeek = moment().endOf("week");
  const currentMonthStart = moment(lastFridayPreviousMonth).subtract(2, "day");
  const currentMonthEnd = moment(lastThursdayCurrentMonth);
  console.log(currentMonthStart, currentMonthEnd, "??????????????/");

  let totals = pnlList.reduce(
    (acc, item, index) => {
      const itemDate = moment(item.date, "DD/MM/YYYY");
      acc.totalPnlValue += item.pnlValue;
      acc.totalROI += item.ROI;

      // Update latest profit/loss and peak balance
      if (item.pnlValue >= 0) {
        acc.latestProfit = item.pnlValue;
        acc.peakBalance += item.pnlValue;
      } else {
        acc.latestLoss = item.pnlValue;
      }

      // Calculate DD and MDD
      if (index === 0) {
        // For the first PNL value
        if (item.pnlValue < 0) {
          acc.DD = item.pnlValue;
          acc.MDD = item.pnlValue;
        } else {
          acc.DD = 0;
          acc.MDD = 0;
        }
      } else {
        if (item.pnlValue < 0) {
          console.log("ifffffffffffffff", item.pnlValue);

          // For negative PNL, increase both DD and MDD
          acc.DD += item.pnlValue;
          console.log(acc.DD, "dddddddddddddddddddddddd");

          if (acc.DD < latestMDD) {
            console.log("|||||||||||||||||||||||||");

            acc.MDD = acc.DD;
            console.log(acc.MDD, "mmmmmmmmmmmmmmdddddddddddd");
          } else {
            acc.MDD = latestMDD;
          }
        } else {
          console.log("elseeeeeeeeeeeeeeeeeeeeeeeeeeee", acc.DD, item.pnlValue);

          // For positive PNL, decrease DD but keep MDD unchanged
          // console.log(acc.DD - item.pnlValue, "#3333333");

          // acc.DD = Math.max(0, Math.abs(item.pnlValue - Math.abs(acc.DD)));
          // console.log(acc.DD, "111111111111111111");
          acc.DD += item.pnlValue;
          if (acc.DD > 0) {
            acc.DD = 0;
          }
        }
      }
      // console.log(acc.DD, acc.MDD, "%%%%%%%%%%%");

      // Other calculations remain the same
      if (item.pnlValue > 0) {
        acc.winDays++;
        acc.totalWinProfit += item.pnlValue;
        acc.currentWinStreak++;
        acc.currentLossStreak = 0;
        if (acc.currentWinStreak > acc.maxWinStreak) {
          acc.maxWinStreak = acc.currentWinStreak;
        }
        if (item.pnlValue > acc.maxProfit) {
          acc.maxProfit = item.pnlValue;
        }
      } else {
        acc.lossDays++;
        acc.totalLoss += item.pnlValue;
        acc.currentLossStreak++;
        acc.currentWinStreak = 0;
        if (acc.currentLossStreak > acc.maxLossStreak) {
          acc.maxLossStreak = acc.currentLossStreak;
        }
        if (item.pnlValue < acc.maxLoss) {
          acc.maxLoss = item.pnlValue;
        }
      }

      // Calculate today's PnL
      if (itemDate.isSame(today, "day")) {
        acc.todayPNL += item.pnlValue;
      }
      // Calculate current week's PnL
      console.log(startOfWeek, ">>>>>>>>>>>", endOfWeek);

      if (itemDate.isAfter(startOfWeek) && itemDate.isBefore(endOfWeek)) {
        console.log("inside week if condition", acc.currentWeekPNL);
        acc.currentWeekPNL += item.pnlValue;
        console.log("inside week if conditionnnnnnnnnnn", acc.currentWeekPNL);
      }
      // Calculate current month's PnL
      if (
        itemDate.isAfter(currentMonthStart) &&
        itemDate.isBefore(currentMonthEnd)
      ) {
        console.log("inside ifffffff", itemDate);
        console.log("insidd", acc.currentMonthPNL);
        console.log("@@@@", item.pnlValue);

        acc.currentMonthPNL += item.pnlValue;
        console.log(">>>>>>>>>", acc.currentMonthPNL);
      }

      return acc;
    },
    {
      totalPnlValue: 0,
      totalROI: 0,
      winDays: 0,
      lossDays: 0,
      totalWinProfit: 0,
      totalLoss: 0,
      maxProfit: -Infinity,
      maxLoss: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      currentLossStreak: 0,
      maxLossStreak: 0,
      latestProfit: 0,
      latestLoss: 0,
      todayPNL: 0,
      currentWeekPNL: 0,
      currentMonthPNL: 0,
      peakBalance: 0,
      DD: 0,
      MDD: 0,
    }
  );

  return totals;
};
export const overallPNL1 = (
  pnlList,
  lastFridayPreviousMonth,
  lastThursdayCurrentMonth,
  latestMDD
) => {
  console.log("djfehfsf!!!!!!!!!!!!!!!!!!!!!fkjgrj==========", latestMDD);

  const today = moment().startOf("day");
  const startOfWeek = moment().startOf("week").subtract(1, "day");
  const endOfWeek = moment().endOf("week");
  const currentMonthStart = moment(lastFridayPreviousMonth).subtract(2, "day");
  const currentMonthEnd = moment(lastThursdayCurrentMonth);
  console.log(currentMonthStart, currentMonthEnd, "??????????????/");

  let totals = pnlList.reduce(
    (acc, item, index) => {
      const itemDate = moment(item.date, "DD/MM/YYYY");
      acc.totalPnlValue += item.pnlValue;
      acc.totalROI += item.ROI;

      // Update latest profit/loss and peak balance
      if (item.pnlValue >= 0) {
        acc.latestProfit = item.pnlValue;
        acc.peakBalance += item.pnlValue;
      } else {
        acc.latestLoss = item.pnlValue;
      }

      // Calculate DD and MDD
      if (index === 0) {
        // For the first PNL value
        if (item.pnlValue < 0) {
          acc.DD = item.pnlValue;
          acc.MDD = item.pnlValue;
        } else {
          acc.DD = 0;
          acc.MDD = 0;
        }
      } else {
        if (item.pnlValue < 0) {
          console.log("ifffffffffffffff", item.pnlValue);

          // For negative PNL, increase both DD and MDD
          acc.DD += item.pnlValue;
          console.log(acc.DD, "dddddddddddddddddddddddd");

          if (acc.DD < latestMDD) {
            console.log("|||||||||||||||||||||||||");

            acc.MDD = acc.DD;
            console.log(acc.MDD, "mmmmmmmmmmmmmmdddddddddddd");
          } else {
            acc.MDD = latestMDD;
          }
        } else {
          console.log("elseeeeeeeeeeeeeeeeeeeeeeeeeeee", acc.DD, item.pnlValue);

          // For positive PNL, decrease DD but keep MDD unchanged
          // console.log(acc.DD - item.pnlValue, "#3333333");

          // acc.DD = Math.max(0, Math.abs(item.pnlValue - Math.abs(acc.DD)));
          // console.log(acc.DD, "111111111111111111");
          acc.DD += item.pnlValue;
          if (acc.DD > 0) {
            acc.DD = 0;
          }
        }
      }
      // console.log(acc.DD, acc.MDD, "%%%%%%%%%%%");

      // Other calculations remain the same
      if (item.pnlValue > 0) {
        acc.winDays++;
        acc.totalWinProfit += item.pnlValue;
        acc.currentWinStreak++;
        acc.currentLossStreak = 0;
        if (acc.currentWinStreak > acc.maxWinStreak) {
          acc.maxWinStreak = acc.currentWinStreak;
        }
        if (item.pnlValue > acc.maxProfit) {
          acc.maxProfit = item.pnlValue;
        }
      } else {
        acc.lossDays++;
        acc.totalLoss += item.pnlValue;
        acc.currentLossStreak++;
        acc.currentWinStreak = 0;
        if (acc.currentLossStreak > acc.maxLossStreak) {
          acc.maxLossStreak = acc.currentLossStreak;
        }
        if (item.pnlValue < acc.maxLoss) {
          acc.maxLoss = item.pnlValue;
        }
      }

      // Calculate today's PnL
      if (itemDate.isSame(today, "day")) {
        acc.todayPNL += item.pnlValue;
      }
      // Calculate current week's PnL
      console.log(startOfWeek, ">>>>>>>>>>>", endOfWeek);

      if (itemDate.isAfter(startOfWeek) && itemDate.isBefore(endOfWeek)) {
        console.log("inside week if condition", acc.currentWeekPNL);
        acc.currentWeekPNL += item.pnlValue;
        console.log("inside week if conditionnnnnnnnnnn", acc.currentWeekPNL);
      }
      // Calculate current month's PnL
      if (
        itemDate.isAfter(currentMonthStart) &&
        itemDate.isBefore(currentMonthEnd)
      ) {
        console.log("inside ifffffff", itemDate);
        console.log("insidd", acc.currentMonthPNL);
        console.log("@@@@", item.pnlValue);

        acc.currentMonthPNL = item.pnlValue;
        console.log(">>>>>>>>>", acc.currentMonthPNL);
      }

      return acc;
    },
    {
      totalPnlValue: 0,
      totalROI: 0,
      winDays: 0,
      lossDays: 0,
      totalWinProfit: 0,
      totalLoss: 0,
      maxProfit: -Infinity,
      maxLoss: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      currentLossStreak: 0,
      maxLossStreak: 0,
      latestProfit: 0,
      latestLoss: 0,
      todayPNL: 0,
      currentWeekPNL: 0,
      currentMonthPNL: 0,
      peakBalance: 0,
      DD: 0,
      MDD: 0,
    }
  );

  return totals;
};
//---------------------------***********************-----------------------

// export const overallPNL = (
//   pnlList,
//   lastFridayPreviousMonth,
//   lastThursdayCurrentMonth
// ) => {
//   const today = moment().startOf("day");
//   const startOfWeek = moment().startOf("week");
//   const startOfMonth = moment(lastFridayPreviousMonth);
//   const endOfMonth = moment(lastThursdayCurrentMonth);

//   let totals = pnlList.reduce(
//     (acc, item, index) => {
//       const itemDate = moment(item.date, "DD/MM/YYYY");
//       acc.totalPnlValue += item.pnlValue;
//       acc.totalROI += item.ROI;

//       // Update latest profit/loss
//       if (item.pnlValue >= 0) {
//         acc.latestProfit = item.pnlValue;
//       } else {
//         acc.latestLoss = item.pnlValue;
//       }

//       // Update latest max profit and reset maxLossAfterLatestMaxProfit
//       if (index === 0 || item.pnlValue > acc.latestMaxProfit) {
//         acc.latestMaxProfit = item.pnlValue;
//         acc.maxLossAfterLatestMaxProfit = item.pnlValue;
//         acc.DD = 0;
//         acc.MDD = 0;
//       } else {
//         // Update DD and MDD
//         const currentDD = acc.latestMaxProfit - item.pnlValue;
//         acc.DD = Math.max(acc.DD, currentDD);
//         acc.MDD = Math.max(acc.MDD, currentDD);

//         // Update max loss after latest max profit
//         acc.maxLossAfterLatestMaxProfit = Math.min(
//           acc.maxLossAfterLatestMaxProfit,
//           item.pnlValue
//         );
//       }

//       // Other calculations remain the same
//       if (item.pnlValue > 0) {
//         acc.winDays++;
//         acc.totalWinProfit += item.pnlValue;
//         acc.currentWinStreak++;
//         acc.currentLossStreak = 0;
//         if (acc.currentWinStreak > acc.maxWinStreak) {
//           acc.maxWinStreak = acc.currentWinStreak;
//         }
//         if (item.pnlValue > acc.maxProfit) {
//           acc.maxProfit = item.pnlValue;
//         }
//       } else {
//         acc.lossDays++;
//         acc.totalLoss += item.pnlValue;
//         acc.currentLossStreak++;
//         acc.currentWinStreak = 0;
//         if (acc.currentLossStreak > acc.maxLossStreak) {
//           acc.maxLossStreak = acc.currentLossStreak;
//         }
//         if (item.pnlValue < acc.maxLoss) {
//           acc.maxLoss = item.pnlValue;
//         }
//       }

//       // Calculate today's PnL
//       if (itemDate.isSame(today, "day")) {
//         acc.todayPNL += item.pnlValue;
//       }
//       // Calculate current week's PnL
//       if (itemDate.isSameOrAfter(startOfWeek)) {
//         acc.currentWeekPNL += item.pnlValue;
//       }
//       // Calculate current month's PnL
//       if (
//         itemDate.isSameOrAfter(startOfMonth) &&
//         itemDate.isSameOrBefore(endOfMonth)
//       ) {
//         acc.currentMonthPNL += item.pnlValue;
//       }

//       return acc;
//     },
//     {
//       totalPnlValue: 0,
//       totalROI: 0,
//       winDays: 0,
//       lossDays: 0,
//       totalWinProfit: 0,
//       totalLoss: 0,
//       maxProfit: -Infinity,
//       maxLoss: 0,
//       currentWinStreak: 0,
//       maxWinStreak: 0,
//       currentLossStreak: 0,
//       maxLossStreak: 0,
//       latestProfit: 0,
//       latestLoss: 0,
//       todayPNL: 0,
//       currentWeekPNL: 0,
//       currentMonthPNL: 0,
//       latestMaxProfit: 0,
//       maxLossAfterLatestMaxProfit: 0,
//       MDD: 0,
//       DD: 0,
//     }
//   );

//   return totals;
// };

//-----------------------------*****************-----------------------------------------

// export const overallPNL = (
//   pnlList,
//   lastFridayPreviousMonth,
//   lastThursdayCurrentMonth
// ) => {
//   const today = moment().startOf("day");
//   const startOfWeek = moment().startOf("week");
//   const startOfMonth = moment().startOf("month");
//   let totals = pnlList.reduce(
//     (acc, item, index) => {
//       const itemDate = moment(item.date, "DD/MM/YYYY");
//       acc.totalPnlValue += item.pnlValue;
//       acc.totalROI += item.ROI;

//       // Update latest profit/loss
//       if (item.pnlValue >= 0) {
//         acc.latestProfit = item.pnlValue;
//       } else {
//         acc.latestLoss = item.pnlValue;
//       }

//       // Update latest max profit and reset maxLossAfterLatestMaxProfit
//       if (item.pnlValue > acc.latestMaxProfit) {
//         acc.latestMaxProfit = item.pnlValue;
//         acc.maxLossAfterLatestMaxProfit = 0;
//       }

//       // Update max loss after latest max profit
//       if (item.pnlValue < acc.maxLossAfterLatestMaxProfit) {
//         acc.maxLossAfterLatestMaxProfit = item.pnlValue;
//       }

//       // Calculate DD
//       acc.DD = acc.latestMaxProfit - acc.latestLoss;

//       // Calculate MDD
//       const currentMDD = acc.latestMaxProfit - acc.maxLossAfterLatestMaxProfit;
//       if (currentMDD > acc.MDD) {
//         acc.MDD = currentMDD;
//       }

//       // Other calculations remain the same
//       if (item.pnlValue > 0) {
//         acc.winDays++;
//         acc.totalWinProfit += item.pnlValue;
//         acc.currentWinStreak++;
//         acc.currentLossStreak = 0;
//         if (acc.currentWinStreak > acc.maxWinStreak) {
//           acc.maxWinStreak = acc.currentWinStreak;
//         }
//         if (item.pnlValue > acc.maxProfit) {
//           acc.maxProfit = item.pnlValue;
//         }
//       } else {
//         acc.lossDays++;
//         acc.totalLoss += item.pnlValue;
//         acc.currentLossStreak++;
//         acc.currentWinStreak = 0;
//         if (acc.currentLossStreak > acc.maxLossStreak) {
//           acc.maxLossStreak = acc.currentLossStreak;
//         }
//         if (item.pnlValue < acc.maxLoss) {
//           acc.maxLoss = item.pnlValue;
//         }
//       }

//       // Calculate today's PnL
//       if (itemDate.isSame(today, "day")) {
//         acc.todayPNL += item.pnlValue;
//       }
//       // Calculate current week's PnL
//       if (itemDate.isSameOrAfter(startOfWeek)) {
//         acc.currentWeekPNL += item.pnlValue;
//       }
//       // Calculate current month's PnL
//       if (itemDate.isSameOrAfter(startOfMonth)) {
//         acc.currentMonthPNL += item.pnlValue;
//       }

//       return acc;
//     },
//     {
//       totalPnlValue: 0,
//       totalROI: 0,
//       winDays: 0,
//       lossDays: 0,
//       totalWinProfit: 0,
//       totalLoss: 0,
//       maxProfit: -Infinity,
//       maxLoss: 0,
//       currentWinStreak: 0,
//       maxWinStreak: 0,
//       currentLossStreak: 0,
//       maxLossStreak: 0,
//       latestProfit: 0,
//       latestLoss: 0,
//       todayPNL: 0,
//       currentWeekPNL: 0,
//       currentMonthPNL: 0,
//       latestMaxProfit: 0,
//       maxLossAfterLatestMaxProfit: 0,
//       MDD: 0,
//       DD: 0,
//     }
//   );

//   return totals;
// };

//-----------------------------------------

// export const overallPNL = (pnlList) => {
//   // Check if pnlList length is 1, set MDD and DD to 0
//   if (pnlList.length === 1) {
//     return {
//       totalPnlValue: pnlList[0].pnlValue,
//       totalROI: pnlList[0].ROI,
//       winDays: pnlList[0].pnlValue > 0 ? 1 : 0,
//       lossDays: pnlList[0].pnlValue <= 0 ? 1 : 0,
//       totalWinProfit: pnlList[0].pnlValue > 0 ? pnlList[0].pnlValue : 0,
//       totalLoss: pnlList[0].pnlValue <= 0 ? pnlList[0].pnlValue : 0,
//       maxProfit: pnlList[0].pnlValue > 0 ? pnlList[0].pnlValue : -Infinity,
//       maxLoss: pnlList[0].pnlValue <= 0 ? pnlList[0].pnlValue : 0,
//       currentWinStreak: pnlList[0].pnlValue > 0 ? 1 : 0,
//       maxWinStreak: pnlList[0].pnlValue > 0 ? 1 : 0,
//       currentLossStreak: pnlList[0].pnlValue <= 0 ? 1 : 0,
//       maxLossStreak: pnlList[0].pnlValue <= 0 ? 1 : 0,
//       latestProfit: pnlList[0].pnlValue > 0 ? pnlList[0].pnlValue : 0,
//       latestLoss: pnlList[0].pnlValue <= 0 ? pnlList[0].pnlValue : 0,
//       todayPNL: pnlList[0].pnlValue,
//       currentWeekPNL: pnlList[0].pnlValue,
//       currentMonthPNL: pnlList[0].pnlValue,
//       latestMaxProfit: pnlList[0].pnlValue > 0 ? pnlList[0].pnlValue : 0,
//       maxLossAfterLatestMaxProfit: 0,
//       MDD: 0,
//       DD: 0,
//     };
//   }

//   const today = moment().startOf("day");
//   const startOfWeek = moment().startOf("week");
//   const startOfMonth = moment().startOf("month");

//   let totals = pnlList.reduce(
//     (acc, item, index) => {
//       const itemDate = moment(item.date, "DD/MM/YYYY");
//       acc.totalPnlValue += item.pnlValue;
//       acc.totalROI += item.ROI;

//       // Update latest profit/loss
//       if (item.pnlValue >= 0) {
//         acc.latestProfit = item.pnlValue;
//       } else {
//         acc.latestLoss = item.pnlValue;
//       }

//       // Update latest max profit and reset maxLossAfterLatestMaxProfit
//       if (item.pnlValue > acc.latestMaxProfit) {
//         acc.latestMaxProfit = item.pnlValue;
//         acc.maxLossAfterLatestMaxProfit = 0;
//       }

//       // Update max loss after latest max profit
//       if (item.pnlValue < acc.maxLossAfterLatestMaxProfit) {
//         acc.maxLossAfterLatestMaxProfit = item.pnlValue;
//       }

//       // Calculate DD
//       acc.DD = acc.latestMaxProfit - acc.latestLoss;

//       // Calculate MDD
//       const currentMDD = acc.latestMaxProfit - acc.maxLossAfterLatestMaxProfit;
//       if (currentMDD > acc.MDD) {
//         acc.MDD = currentMDD;
//       }

//       // Other calculations remain the same
//       if (item.pnlValue > 0) {
//         acc.winDays++;
//         acc.totalWinProfit += item.pnlValue;
//         acc.currentWinStreak++;
//         acc.currentLossStreak = 0;
//         if (acc.currentWinStreak > acc.maxWinStreak) {
//           acc.maxWinStreak = acc.currentWinStreak;
//         }
//         if (item.pnlValue > acc.maxProfit) {
//           acc.maxProfit = item.pnlValue;
//         }
//       } else {
//         acc.lossDays++;
//         acc.totalLoss += item.pnlValue;
//         acc.currentLossStreak++;
//         acc.currentWinStreak = 0;
//         if (acc.currentLossStreak > acc.maxLossStreak) {
//           acc.maxLossStreak = acc.currentLossStreak;
//         }
//         if (item.pnlValue < acc.maxLoss) {
//           acc.maxLoss = item.pnlValue;
//         }
//       }

//       // Calculate today's PnL
//       if (itemDate.isSame(today, "day")) {
//         acc.todayPNL += item.pnlValue;
//       }
//       // Calculate current week's PnL
//       if (itemDate.isSameOrAfter(startOfWeek)) {
//         acc.currentWeekPNL += item.pnlValue;
//       }
//       // Calculate current month's PnL
//       if (itemDate.isSameOrAfter(startOfMonth)) {
//         acc.currentMonthPNL += item.pnlValue;
//       }

//       return acc;
//     },
//     {
//       totalPnlValue: 0,
//       totalROI: 0,
//       winDays: 0,
//       lossDays: 0,
//       totalWinProfit: 0,
//       totalLoss: 0,
//       maxProfit: -Infinity,
//       maxLoss: 0,
//       currentWinStreak: 0,
//       maxWinStreak: 0,
//       currentLossStreak: 0,
//       maxLossStreak: 0,
//       latestProfit: 0,
//       latestLoss: 0,
//       todayPNL: 0,
//       currentWeekPNL: 0,
//       currentMonthPNL: 0,
//       latestMaxProfit: 0,
//       maxLossAfterLatestMaxProfit: 0,
//       MDD: 0,
//       DD: 0,
//     }
//   );

//   return totals;
// };

// export const calculateWeekdayPNLSummary = (portfolio) => {
//   const weekdays = [
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//     "Sunday",
//   ];
//   const weekdayPNLMap = new Map<string, number>();

//   // Initialize the map with all weekdays set to 0
//   weekdays.forEach((day) => weekdayPNLMap.set(day, 0));

//   // Sum up the PNL values for each weekday
//   portfolio.pnlList.forEach((pnl) => {
//     const currentTotal = weekdayPNLMap.get(pnl.day) || 0;
//     weekdayPNLMap.set(pnl.day, currentTotal + pnl.pnlValue);
//   });

//   // Convert the map to the desired output format
//   const result = weekdays.map((day) => ({
//     day,
//     totalPnl: weekdayPNLMap.get(day) || 0,
//   }));

//   return result;
// };

const DEFAULT_WEEKDAY_SUMMARY = [
  { day: "Monday", totalPnl: 0 },
  { day: "Tuesday", totalPnl: 0 },
  { day: "Wednesday", totalPnl: 0 },
  { day: "Thursday", totalPnl: 0 },
  { day: "Friday", totalPnl: 0 },
  { day: "Saturday", totalPnl: 0 },
  { day: "Sunday", totalPnl: 0 },
];

export const calculateWeekdayPNLSummary = (portfolio: any) => {
  if (!portfolio || !portfolio.pnlList || portfolio.pnlList.length === 0) {
    return DEFAULT_WEEKDAY_SUMMARY;
  }

  const weekdayPNLMap = new Map<string, number>();

  // Initialize the map with all weekdays set to 0
  DEFAULT_WEEKDAY_SUMMARY.forEach(({ day }) => weekdayPNLMap.set(day, 0));

  // Sum up the PNL values for each weekday
  portfolio.pnlList.forEach((pnl: any) => {
    const currentTotal = weekdayPNLMap.get(pnl.day) || 0;
    weekdayPNLMap.set(pnl.day, currentTotal + pnl.pnlValue);
  });

  // Convert the map to the desired output format
  return DEFAULT_WEEKDAY_SUMMARY.map(({ day }) => ({
    day,
    totalPnl: weekdayPNLMap.get(day) || 0,
  }));
};
