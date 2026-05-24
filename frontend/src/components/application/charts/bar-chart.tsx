import { Bar, CartesianGrid, Legend, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartLegendContent, ChartTooltipContent } from "@/components/application/charts/charts-base";
import { useBreakpoint } from "@/hooks/use-breakpoint";

interface BarChartDataItem {
    name: string;
    value: number;
}

interface BarChartProps {
    data?: BarChartDataItem[];
}

export const BarChart = ({ data = [] }: BarChartProps) => {
    const isDesktop = useBreakpoint("lg");

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Team Leaderboard</h3>
            <div className="h-56 w-full">
                <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full w-full">
                    <RechartsBarChart
                        data={data}
                        className="text-tertiary [&_.recharts-text]:text-xs"
                        margin={{
                            left: 10,
                            right: 20,
                            top: isDesktop ? 8 : 4,
                            bottom: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />

                        <Legend
                            verticalAlign="top"
                            align="right"
                            layout={isDesktop ? "vertical" : "horizontal"}
                            content={<ChartLegendContent className="-translate-y-2" />}
                        />

                        <XAxis
                            fill="currentColor"
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            interval="preserveStartEnd"
                            dataKey="name"
                        />

                        <YAxis
                            fill="currentColor"
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            width={60}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />

                        <Tooltip
                            content={<ChartTooltipContent />}
                            formatter={(value) => `$${Number(value).toLocaleString()}`}
                            cursor={{ className: "fill-utility-neutral-200/20" }}
                        />

                        <Bar
                            isAnimationActive={false}
                            className="text-utility-brand-600"
                            dataKey="value"
                            name="Pipeline Value"
                            fill="#8b5cf6"
                            maxBarSize={isDesktop ? 36 : 24}
                            radius={[4, 4, 0, 0]}
                        />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
