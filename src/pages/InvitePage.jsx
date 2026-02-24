import { useState } from "react";
import api from "../app/store";

export default function InvitePage() {
  const [form, setForm] = useState({});
  const [timer, setTimer] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/auth/invite", form);

    setTimer(300); // 5 mins
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) clearInterval(interval);
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div>
      <h2>Invite User</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="First Name" onChange={(e)=>setForm({...form,firstName:e.target.value})}/>
        <input placeholder="Last Name" onChange={(e)=>setForm({...form,lastName:e.target.value})}/>
        <input placeholder="Email" onChange={(e)=>setForm({...form,email:e.target.value})}/>
        <input placeholder="Phone" onChange={(e)=>setForm({...form,phone:e.target.value})}/>
        <input placeholder="Admin Secret Key" onChange={(e)=>setForm({...form,adminKey:e.target.value})}/>
        <button type="submit">Send Invite</button>
      </form>

      {timer > 0 && (
        <p>Next invite available in: {Math.floor(timer/60)}:{timer%60}</p>
      )}
    </div>
  );
}