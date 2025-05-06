import React, { useEffect, useRef, useState } from "react"

const ASLStream = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const [streamImg, setStreamImg] = useState(null)

  useEffect(() => {
    // Mở webcam
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream
    })

    // Kết nối WebSocket
    const ws = new WebSocket("ws://localhost:8000/ws/stream")
    wsRef.current = ws

    ws.onmessage = (event) => {
      setStreamImg(`data:image/jpeg;base64,${event.data}`)
    }

    return () => ws.close()
  }, [])

  // Gửi ảnh định kỳ
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ws = wsRef.current

      if (!video || !canvas || !ws || ws.readyState !== 1) return

      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1]
          ws.send(base64)
        }
        reader.readAsDataURL(blob)
      }, "image/jpeg")
    }, 150) // ~6-7 FPS

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold">🧠 Nhận diện ASL Realtime (YOLOv11)</h2>

      <video ref={videoRef} autoPlay playsInline width="320" height="240" className="rounded shadow" />
      <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />

      {streamImg && (
        <img src={streamImg} alt="ASL result" className="rounded border shadow mx-auto" width="320" height="240" />
      )}
    </div>
  )
}

export default ASLStream
