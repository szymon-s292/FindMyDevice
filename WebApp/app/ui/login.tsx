"use client"

import axios, { AxiosError } from "axios";
import { Dispatch, SetStateAction, useState } from "react";
import { Spinner } from "./spinner";
import api from "../api";

export default function Login({setView}: {setView: Dispatch<SetStateAction<number | null>>}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const signIn = async () => {

    if(email == "" || password == "") {
      setError("Email or password cannot be empty")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      
      const response = await api.login(email, password)

      if (response.status === 200 || response.status === 201) {
        setView(0);
      } else {
        setError("Server error, try again later");
      }
    } catch(err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Invalid email or password");
        } else {
          setError("Server error, try again later");
        }
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    <div className='flex justify-between items-start mb-4'>
      <h2 className="font-semibold text-lg mb-2">Sign in</h2>
    </div>

    <div className="flex flex-col  items-center gap-4">
      <div>
        <p>Email</p>
        <input
          type="email"
          name="email"
          className="bg-gray-100 w-64 rounded-lg px-4 py-2 mt-1 outline-none hover:border-gray-200"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
      </div>

      <div>
        <p>Password</p>
        <input
          type="password"
          name="password"
          className="bg-gray-100 w-64 rounded-lg px-4 py-2 mt-1 outline-none hover:border-gray-200"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
      </div>

      <div className="flex flex-col mt-2 w-full items-center">
        <div className="">
          {loading ? (
            <div className="flex justify-center items-center h-10">
              <Spinner/>
            </div>
          ) : (
            <>
              <button onClick={signIn} className="h-10 w-64 rounded-lg px-4 py-2 bg-slate-100 hover:bg-slate-200 cursor-pointer">Sign In</button>
              {error && <p className="mt-4 text-xs text-center text-red-400">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}