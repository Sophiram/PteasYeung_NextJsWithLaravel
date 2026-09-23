'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// -------------------------------------------------------------
// ១. Component សម្រាប់ Donut Chart (ស្ថិតិបែងចែកប្រព័ន្ធ)
// -------------------------------------------------------------
interface DonutChartProps {
  seriesData?: number[];
  labelsData?: string[];
}

export function OperationalDonutChart({ seriesData = [0, 0, 0], labelsData = [] }: DonutChartProps) {
  const defaultLabels = ['សមាជិកសរុប', 'អចលនទ្រព្យ', 'បន្ទប់ជួលសរុប'];
  const finalLabels = labelsData && labelsData.length > 0 ? labelsData : defaultLabels;

  // គណនាផលបូកចំនួនសរុបពិតប្រាកដ (ឧទាហរណ៍៖ សមាជិក ៤ + អចលនទ្រព្យ ១ + បន្ទប់ ២០ = ២៥ នាក់/ខ្នង)
  const totalCount = seriesData.reduce((a, b) => a + b, 0);

  const options: ApexCharts.ApexOptions = {
    chart: { type: 'donut' },
    labels: finalLabels,
    colors: ['#696cff', '#71dd37', '#03c3ec', '#8592a3'],
    stroke: { show: true, colors: ['#ffffff'], width: 3 },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontFamily: 'inherit',
      fontSize: '13px',
      labels: { colors: '#a1b0cb' },
      markers: { size: 5, offsetX: -4 }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: '#566a7f',
              offsetY: 4,
              // ពេល hover បង្ហាញចំនួនលេខធម្មតា (មិនមែនភាគរយទេ នាំឱ្យវង្វេង)
              formatter: (val: string | number) => val ? parseInt(String(val)).toLocaleString() : totalCount.toLocaleString()
            },
            name: {
              show: true,
              fontSize: '13px',
              fontFamily: 'inherit',
              color: '#a1b0cb',
              offsetY: -10
            },
            total: {
              show: true,
              label: 'សរុបរួម',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 500,
              color: '#a1b0cb',
              formatter: () => totalCount.toLocaleString() // ✨ បង្ហាញចំនួនសរុបពិតប្រាកដចំកណ្តាលរង្វង់ Font ស្អាតដូចគ្នា
            }
          }
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-xs flex flex-col items-center justify-between h-full w-full">
      <h3 className="text-sm font-bold self-start mb-5 text-slate-800 dark:text-slate-200">ស្ថិតិបែងចែកប្រព័ន្ធ</h3>
      <div className="w-full max-w-[260px] flex-1 flex items-center justify-center">
        <Chart options={options} series={seriesData} type="donut" width="100%" />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ២. Component សម្រាប់ Bar Chart (របាយការណ៍ប្រចាំសប្តាហ៍)
// -------------------------------------------------------------
interface BarChartProps {
  categories?: string[];
  dataValues?: number[];
  isSample?: boolean;
}

export function WeeklyBarChart({ categories = [], dataValues = [], isSample = false }: BarChartProps) {
  const series = [{
    name: 'ទឹកប្រាក់ចំណាយ ($)',
    data: dataValues
  }];

  const maxVal = Math.max(...dataValues, 10);
  const yAxisMax = Math.ceil(maxVal / 50) * 50;

  const options: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    colors: ['#03c3ec'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '35%',
        borderRadius: 5,
        borderRadiusApplication: 'end'
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#a1b0cb', fontSize: '11px', fontFamily: 'inherit' } }
    },
    yaxis: {
      min: 0,
      max: yAxisMax,
      tickAmount: 4,
      labels: { style: { colors: '#a1b0cb', fontSize: '11px', fontFamily: 'inherit' } }
    },
    grid: {
      borderColor: '#f1f5f9',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-xs w-full h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">របាយការណ៍ចំណាយប្រចាំសប្តាហ៍</h3>
        {isSample && (
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-semibold animate-pulse">
            ទិន្នន័យគំរូ
          </span>
        )}
      </div>
      <div className="w-full">
        <Chart options={options} series={series} type="bar" height={220} width="100%" />
      </div>
    </div>
  );
}