import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL as string

const api = {
    get: async (url: string) => {
        return await axios.get(url, {
            withCredentials: true,
        })
    },
    post: async (url: string, data?: string) => {
        return await axios.post(url, null, {
            withCredentials: true
        })
    },

    login: async (email: string, password: string) => {
        return await axios.post(API_URL + "/auth/login", {
            email: email,
            password: password
        }, {
            withCredentials: true
        })
    },
    logout: async () => {
        return await axios.post(API_URL + "/auth/logout", null, {
            withCredentials: true
        })
    },
    getDevices: async () => {
        return await axios.get(API_URL + '/user/devices', {
            withCredentials: true
        })
    },
    locateDevice: async (deviceId: number) => {
        return await axios.post(`${API_URL}/device/${deviceId}/locate`, null, {
            withCredentials: true
        })
    }
}

export default api