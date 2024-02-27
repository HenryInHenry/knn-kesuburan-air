'use client'
import axios, { Method } from 'axios'
import { useState } from 'react'

const useAxios = <T extends object>() => {
  const [csrfToken, setCsrfToken] = useState<string>('')

  const getCsrfToken = async () => {
    const response = await axios.get('/sanctum/csrf-cookie')
    setCsrfToken(response.data)
  }

  const axiosCsrf = axios.create({
    baseURL: '/',
    withCredentials: true,
    headers: {
      'X-CSRF-TOKEN': csrfToken,
    },
  })
  
  // function to convert data to form data
  const toFormData = (obj: T, fileKeys: string[], method?: Method) => {
    const formData = new FormData()
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) continue

      if (fileKeys.includes(key) && typeof obj[key] !== 'string') {
        formData.append(key, (obj[key] as File))
        console.log('file:', (obj[key] as File).name)
      } else if (typeof obj[key] === 'string' && !fileKeys.includes(key)) {
        formData.append(key, obj[key] as string)
      }
    }
    for(const pair of formData.entries()) {
      console.log(pair[0]+ ', '+ pair[1]) 
    }

    if (method) {
      formData.append('_method', method)
    }

    return formData
  }

  const axiosBase = axios.create({
    baseURL: '/',
    withCredentials: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  return { 
    toFormData,
    axiosCsrf,
    getCsrfToken, 
    axiosBase 
  }
}

export default useAxios