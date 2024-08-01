import moment from "moment";

export const calculateMonth = (date) => {
  const currentDate = new Date(date);
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });

  const currentMonth = formatter.format(currentDate);
  const currentYear = currentDate.getFullYear();

  // Get the previous month
  const previousMonthDate = new Date(currentDate);
  previousMonthDate.setMonth(currentDate.getMonth() - 1);
  const previousMonth = formatter.format(previousMonthDate);
  const previousMonthYear = previousMonthDate.getFullYear();

  const lastFridayPreviousMonth = getLastFriday(previousMonthDate);
  const lastThursdayCurrentMonth = getLastThursday(currentDate);

  let month;
  if (moment(date).isSameOrBefore(lastThursdayCurrentMonth)) {
    if (currentYear === previousMonthYear) {
      month = `${previousMonth}-${currentMonth} (${currentYear})`;
    } else {
      month = `${previousMonth}-${currentMonth} (${previousMonthYear}-${currentYear
        .toString()
        .slice(2)})`;
    }
  } else {
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    const nextMonth = formatter.format(nextMonthDate);
    const nextMonthYear = nextMonthDate.getFullYear();

    if (currentYear === nextMonthYear) {
      month = `${currentMonth}-${nextMonth} (${currentYear})`;
    } else {
      month = `${currentMonth}-${nextMonth} (${currentYear}-${nextMonthYear
        .toString()
        .slice(2)})`;
    }
  }

  return {
    currentDate,
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

export const calculateTotalDays = (date) => {
  let { lastFridayPreviousMonth, lastThursdayCurrentMonth, month } =
    calculateMonth(date);
  const totalDays =
    lastThursdayCurrentMonth.diff(lastFridayPreviousMonth, "days") + 1;
  return { totalDays, month };
};

function getLastThursday(date) {
  let lastDayOfMonth = moment(date).endOf("month");

  // Find the last Thursday
  while (lastDayOfMonth.day() !== 4) {
    lastDayOfMonth.subtract(1, "day");
  }
  return lastDayOfMonth;
}

export const calculateROI = (capital, pnl) => {
  let ROI = (pnl / capital) * 100;
  return ROI;
};

export const overallPNL = (pnlList) => {
  const today = moment().startOf("day");
  const startOfWeek = moment().startOf("week");
  const startOfMonth = moment().startOf("month");
  let totals = pnlList.reduce(
    (acc, item) => {
      const itemDate = moment(item.date);

      acc.totalPnlValue += item.pnlValue;
      acc.totalROI += item.ROI;
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
        acc.latestProfit = item.pnlValue;
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
        acc.latestLoss = item.pnlValue;
      }

      // Calculate today's PnL
      if (itemDate.isSame(today, "day")) {
        acc.todayPNL += item.pnlValue;
      }

      // Calculate current week's PnL
      if (itemDate.isSameOrAfter(startOfWeek)) {
        acc.currentWeekPNL += item.pnlValue;
      }

      // Calculate current month's PnL
      if (itemDate.isSameOrAfter(startOfMonth)) {
        acc.currentMonthPNL += item.pnlValue;
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
      maxLoss: Infinity,
      currentWinStreak: 0,
      maxWinStreak: 0,
      currentLossStreak: 0,
      maxLossStreak: 0,
      latestProfit: 0,
      latestLoss: 0,
      todayPNL: 0,
      currentWeekPNL: 0,
      currentMonthPNL: 0,
    }
  );
  return totals;
};
