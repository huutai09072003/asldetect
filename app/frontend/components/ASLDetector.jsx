// app/frontend/components/ASLDetector.jsx

import React, { useRef, useEffect, useState } from "react"

const ASLDetector = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [prediction, setPrediction] = useState("")

  // Bật webcam
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error("Lỗi mở camera:", err)
      }
    }

    startCamera()
  }, [])

  // Chụp hình và gọi API mỗi 2 giây
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      // Vẽ frame từ video vào canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"))

      // Gửi ảnh lên API
      const formData = new FormData()
      formData.append("image", imageBlob, "frame.jpg")

      try {
        const res = await fetch("http://localhost:8000/predict", {
          method: "POST",
          body: formData
        })

        if (res.ok) {
          const result = await res.json()
          setPrediction(result?.label || "Không rõ")
        } else {
          console.warn("API lỗi:", res.status)
        }
      } catch (err) {
        console.error("Không gọi được API:", err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <video ref={videoRef} autoPlay playsInline width="400" height="300" className="rounded shadow" />
      <canvas ref={canvasRef} width="400" height="300" style={{ display: "none" }} />
      <div className="text-xl font-bold">Kết quả dự đoán: <span className="text-blue-600">{prediction}</span></div>
    </div>
  )
}

export default ASLDetector
