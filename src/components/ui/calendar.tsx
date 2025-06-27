import React from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-overrides.css';
import { CalendarProps } from 'react-calendar';

const meses = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

type Props = {
  tileClassName?: CalendarProps['tileClassName'];
  onChange?: CalendarProps['onChange'];
  selectRange?: boolean;
};

export const Calendar: React.FC<Props> = ({
  tileClassName,
  onChange,
  selectRange = false,
}) => {
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
      {months.map((monthDate, index) => (
        <div
          key={index}
          className="rounded border bg-white p-1 shadow text-xs flex flex-col items-center"
        >
          <h3 className="text-[11px] font-medium text-blue-700 mb-1">
            {meses[monthDate.getMonth()]} {monthDate.getFullYear()}
          </h3>
          <ReactCalendar
            locale="es-ES"
            activeStartDate={monthDate}
            showNavigation={false}
            showNeighboringMonth={false}
            tileClassName={(props) => {
              const isSunday = props.date.getDay() === 0;
              const externalClass =
                typeof tileClassName === 'function'
                  ? tileClassName(props)
                  : tileClassName || '';

              return [isSunday ? 'text-red-500' : '', externalClass]
                .join(' ')
                .trim();
            }}
            onChange={onChange}
            selectRange={selectRange}
            className="scale-80 origin-top"
          />
        </div>
      ))}
    </div>
  );
};
