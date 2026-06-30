import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import './ProgressStats.css';

export default function ProgressStats() {
    const [stats, setStats] = useState<any[]>([]);
    const [overall, setOverall] = useState(0);

    useEffect(() => {
        // Since we don't have a dedicated stats endpoint in this simple version, 
        // we'll calculate it from the PDF list on the client side.
        const fetchStats = async () => {
            try {
                // const res = await api.get('/pdfs');
                // const pdfs = res.data;
                const res = await api.get('/progress');
                // const total_pdfs = res.data.total_pdfs;
                // const completed_pdfs = res.data.completed_pdfs;
                const progress_percentage = res.data.progress_percentage;
                
                setOverall(progress_percentage);    

                // Calculate Overall
                // const completed = pdfs.filter((p:any) => p.completed).length;
                // const total = pdfs.length;
                // setOverall(total === 0 ? 0 : Math.round((completed/total) * 100));

                // Calculate Day-wise stats (Mock logic for demo: Group by dummy days)
                // In a real app, use the `completed_at` timestamp
                const currentFullDate = new Date();
                const currentDay = new Date().getDay(); // 0 (Sun) to 6 (Sat)
                let currentDayName = '';
                switch(currentDay) {    
                    case 0: currentDayName = 'Sun'; break;
                    case 1: currentDayName = 'Mon'; break;
                    case 2: currentDayName = 'Tue'; break;
                    case 3: currentDayName = 'Wed'; break;
                    case 4: currentDayName = 'Thu'; break;
                    case 5: currentDayName = 'Fri'; break;
                    case 6: currentDayName = 'Sat'; break;
                }
                const statDataTillLastWeek = [];
                for(let i = 1; i <= 7; i++) {
                    const date = new Date();
                    date.setDate(currentFullDate.getDate() - i);
                    const day = date.getDay();
                    let dayName = '';
                    switch(day) {
                        case 0: dayName = 'Sun'; break;
                        case 1: dayName = 'Mon'; break;
                        case 2: dayName = 'Tue'; break;
                        case 3: dayName = 'Wed'; break;
                        case 4: dayName = 'Thu'; break;
                        case 5: dayName = 'Fri'; break;
                        case 6: dayName = 'Sat'; break;
                    }
                    const statDataForDay  = await api.get("/completed_pdf_in_particular_day/"+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate());
                    statDataTillLastWeek.push({ day: dayName, tasks: statDataForDay.data.count });
                }
                const completed = statDataTillLastWeek.find(s => s.day === currentDayName)?.tasks || 0;

                const statData  = await api.get("/completed_pdf_in_particular_day/"+currentFullDate.getFullYear()+"-"+(currentFullDate.getMonth()+1)+"-"+currentFullDate.getDate());

                
                setStats([...statDataTillLastWeek.reverse(), { day: currentDayName, tasks: statData.data.count + completed }]);
            } catch(e) { console.error(e); }
        };
        fetchStats();
    }, []);

    return (
        <div className="progress-stats">
            <div className="statistics">
                <h3>Total PDFS</h3>
                <span>{stats.reduce((acc, curr) => acc + curr.tasks, 0)}</span>
                <h3>Uncompleted PDFs </h3>
                <span>{stats.reduce((acc, curr) => acc + curr.tasks, 0) - Math.round((overall / 100) * stats.reduce((acc, curr) => acc + curr.tasks, 0))}</span>
            </div>
            <div className="overall-progress">
                <h3>Overall Completion</h3>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${overall}%` }}></div>
                </div>
                <span>{overall}%</span>
            </div>
            
            <div className="chart-container">
                <h3>Daily Activity</h3>
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <BarChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="day" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Bar dataKey="tasks" fill="#646cff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}