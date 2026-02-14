import React, { useEffect, useState } from "react"
import { fetchExamConfigW, fetchExamQuestionsW } from "./questionsWord"
import { calculateScoreW } from "./scoreWord"
import { API_ROUTING } from '../config';

export interface ExamConfigW {
  exams: string,
  idgv: string,
  mcq: number,
  scoremcq: number,
  tf: number,
  scoretf: number,
  sa: number,
  scoresa: number,
  fulltime: number,
  minitime: number,
  tab: number,
  close: string,
}
interface ExamDelePropsW {
  idgvW: string,
  sbdW: string,
  examsW: string
}

export default function ExamDeleW({
  idgvW,
  sbdW,
  examsW
}: ExamDelePropsW) {
  const [examConfigW, setExamConfigW] = useState<ExamConfigW | null>(null);
  const [questionsW, setQuestionsW] = useState<any[]>([]);
  const [answersW, setAnswersW] = useState<any>({});
  const [timeLeftW, setTimeLeftW] = useState<number>(0);
  const [tabCountW, setTabCountW] = useState<number>(0);
  const [submittedW, setSubmittedW] = useState<boolean>(false);
  const [reviewModeW, setReviewModeW] = useState<boolean>(false);
  const [studentNameW, setStudentNameW] = useState<string>("");
const [studentClassW, setStudentClassW] = useState<string>("");

   /* ================= verifyStudent ================= */
  const verifyStudentW = async () => {
  try {
    const resW = await fetch(API_ROUTING[idgvW], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionW: "verifyStudentW",
        idgvW,
        sbdW
      })
    })

    const dataW = await resW.json()
    console.log("VERIFY:", dataW)

    if (!dataW.successW) {
      alert("Không tìm thấy học sinh")
      return false
    }

    setStudentNameW(dataW.nameW)
    setStudentClassW(dataW.classW)

    return true

  } catch (errW) {
    console.error(errW)
    alert("Lỗi kết nối")
    return false
  }
}

  /* ================= INIT ================= */

  const startExamFlowW = async () => {
  const isValidW = await verifyStudentW()

  if (!isValidW) return

  await initExamW()
}
  const initExamW = async () => {
    const configW = await fetchExamConfigW()
    const questionsRawW = await fetchExamQuestionsW()

    setExamConfigW(configW)
    setQuestionsW(questionsRawW)
    setTimeLeftW(configW.fulltime * 60)

    startTimerW(configW.fulltime * 60)
  }



  /* ================= TIMER ================= */

  const startTimerW = (secondsW: number) => {
    const timerW = setInterval(() => {
      setTimeLeftW(prev => {
        if (prev <= 1) {
          clearInterval(timerW)
          autoSubmitDeleW()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  /* ================= TAB GUARD ================= */

  useEffect(() => {
    if (!examConfigW) return

    const handleVisibilityW = () => {
      if (document.hidden) {
        setTabCountW(prev => {
          const newCountW = prev + 1
          if (newCountW > examConfigW.tab) {
            autoSubmitDeleW()
          }
          return newCountW
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityW)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityW)
    }
  }, [examConfigW])

  /* ================= SUBMIT ================= */

  const autoSubmitDeleW = () => {
    if (submittedW) return
    submitExamDeleW()
  }

  const submitExamDeleW = () => {
    if (!examConfigW) return

    const scoreW = calculateScoreW(
      questionsW,
      answersW,
      examConfigW
    )

    // TODO: gửi lên sheet ketqua

    setSubmittedW(true)
  }

  /* ================= RENDER ================= */

  return (
    <div>
      {!submittedW && (
        <>
          <h2>Time: {timeLeftW}s</h2>
          <p>Tab: {tabCountW}/{examConfigW?.tab ?? 0}</p>

          {questionsW.map((q, indexW) => (
            <div key={q.id}>
              <p>Câu {indexW + 1}</p>
              <div dangerouslySetInnerHTML={{ __html: q.question }} />
            </div>
          ))}

          <button onClick={submitExamDeleW}>
            Nộp bài
          </button>
        </>
      )}

      {submittedW && (
        <>
          <h2>Đã nộp bài</h2>
          <button onClick={() => setReviewModeW(true)}>
            Xem lại bài
          </button>
        </>
      )}
    </div>
  )
}
