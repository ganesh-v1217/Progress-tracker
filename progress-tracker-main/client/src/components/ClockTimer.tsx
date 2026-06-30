import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, X, BellRing } from 'lucide-react';
import './ClockTimer.css';

export default function ClockTimer() {
    const[inputMinutes, setInputMinutes] = useState<number>(0);
    const[inputSeconds, setInputSeconds] = useState<number>(10);
    
    const[timeLeft, setTimeLeft] = useState<number>(10);
    const[initialTime, setInitialTime] = useState<number>(10);
    const[isActive, setIsActive] = useState<boolean>(false);
    const[isPaused, setIsPaused] = useState<boolean>(false); 
    const[showActiveModal, setShowActiveModal] = useState<boolean>(false);
    
    useEffect(() => {
        let interval:ReturnType<typeof setInterval>|null =null;
        if(isActive && !isPaused && timeLeft >0){
            interval = setInterval(() => {
                setTimeLeft((timeLeft) => timeLeft -1);
            }, 1000);
        } else if(timeLeft === 0 && isActive){
            if(interval !== null) clearInterval(interval);
            setIsActive(false);
            setShowActiveModal(true);
        }
        return () => {
            if(interval !== null) clearInterval(interval);
        };
    },[isActive, isPaused, timeLeft]);

    const handleStart = () =>{
        if(isActive && isPaused) {
            setIsPaused(false);
            return;
        }
        const totalSeconds = (inputMinutes*60)+inputSeconds;
        if(totalSeconds <=0) return;

        setInitialTime(totalSeconds);
        setTimeLeft(totalSeconds);
        setIsActive(true);
        setIsPaused(false);
        setShowActiveModal(false);
    };

    const handlePause = () => setIsPaused(true);

    const handleReset = () =>{
        setIsActive(false);
        setIsPaused(false);
        setTimeLeft(0);
        setShowActiveModal(false);
    }

    const formatTime = (seconds :number) : string =>{
        const m = Math.floor(seconds/60);
        const s  = seconds % 60;
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = initialTime ? (timeLeft / initialTime) : 0;
    const strokeDashoffset = circumference * (1 - progress);    

    return (
        <div className="timer-container">
            <div className="timer-circle-wrapper">
                <svg width="256" height="256" className="timer-svg">
                    <circle className="timer-bg-circle" cx="128" cy="128" r={radius} />
                    <circle
                        className="timer-progress-circle"
                        cx="128"
                        cy="128"
                        r={radius}
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset }}
                    />
                </svg>
                <div className="timer-text">
                    <h2>
                        {isActive || timeLeft > 0 ? formatTime(timeLeft) : formatTime((inputMinutes * 60) + inputSeconds)}
                    </h2>
                </div>
            </div>

            {!isActive && (
                <div className="timer-inputs">
                    <div className="input-group">
                        <label>Min</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={inputMinutes}
                            onChange={(e) => setInputMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                    </div>
                    <span className="colon">:</span>
                    <div className="input-group">
                        <label>Sec</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={inputSeconds}
                            onChange={(e) => setInputSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                    </div>
                </div>
            )}

            <div className="timer-controls">
                {!isActive ? (
                    <button className="btn-primary" onClick={handleStart}><Play size={16} /> START</button>
                ) : (
                    <>
                        {isPaused ? (
                            <button className="btn-primary" onClick={handleStart}><Play size={16} /> RESUME</button>
                        ) : (
                            <button className="btn-secondary" onClick={handlePause}><Pause size={16} /> PAUSE</button>
                        )}
                        <button className="btn-danger" onClick={handleReset}><RotateCcw size={16} /> RESET</button>
                    </>
                )}
            </div>

            {showActiveModal && (
                <div className="timer-modal">
                    <div className="modal-content">
                        <BellRing className="modal-icon" />
                        <h2>Time's Up!</h2>
                        <button onClick={() => setShowActiveModal(false)}><X size={16} /> Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
}