import { Document, Schema, Types, model } from "mongoose";

export interface IPortfolio extends Document {
  _id: string;
  userId: Types.ObjectId;
  month: string;
  totalDays: number;
  pnlList: {
    date: string;
    pnlValue: number;
    ROI: number;
  }[];
  totalCapital: number;
  totalPnlValue: number;
  createdAt: Date;
  updatedAt: Date;
  totalROI: number;
  winDays: number;
  winRation: number;
  avgProfit: number;
  totalWinProfit: number;
  maxProfit: number;
  todayPNL: number;
  currentWeekPNL: number;
  currentMonthPNL: number;
  currentDD: number;
  lossDays: number;
  lossRation: number;
  avgLoss: number;
  totalLoss: number;
  maxLoss: number;
  maxWinStreak: number;
  maxLossStreak: number;
  MDD: number;
  MDDRatio: number;
  riskReward: number;
  expectancy: number;
}

const portfolio = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    month: {
      type: String,
      default: "",
    },
    totalDays: {
      type: Number,
      default: 0,
    },
    pnlList: [
      {
        date: String,
        pnlValue: Number,
        ROI: Number,
      },
    ],
    totalCapital: {
      type: Number,
      default: 0,
    },
    totalPnlValue: {
      type: Number,
      default: 0,
    },
    totalROI: {
      type: Number,
      default: 0,
    },
    winDays: {
      type: Number,
      default: 0,
    },
    winRation: {
      type: Number,
      default: 0,
    },
    avgProfit: {
      type: Number,
      default: 0,
    },
    totalWinProfit: {
      type: Number,
      default: 0,
    },
    maxProfit: {
      type: Number,
      default: 0,
    },
    todayPNL: {
      type: Number,
      default: 0,
    },
    currentWeekPNL: {
      type: Number,
      default: 0,
    },
    currentMonthPNL: {
      type: Number,
      default: 0,
    },
    currentDD: {
      type: Number,
      default: 0,
    },
    lossDays: {
      type: Number,
      default: 0,
    },
    lossRation: {
      type: Number,
      default: 0,
    },
    avgLoss: {
      type: Number,
      default: 0,
    },
    totalLoss: {
      type: Number,
      default: 0,
    },
    maxLoss: {
      type: Number,
      default: 0,
    },
    maxWinStreak: {
      type: Number,
      default: 0,
    },
    maxLossStreak: {
      type: Number,
      default: 0,
    },
    MDD: {
      type: Number,
      default: 0,
    },
    MDDRatio: {
      type: Number,
      default: 0,
    },
    riskReward: {
      type: Number,
      default: 0,
    },
    expectancy: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const PortfolioModel = model<IPortfolio>("portfolios", portfolio);
