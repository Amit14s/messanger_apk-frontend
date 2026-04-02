import axios from 'axios'

const apUrl=`${process.env.BACKEND_URL}`

const axiosInstance=axios.create({
    baseURL:apUrl,
    withCredentials:true
})

export default axiosInstance