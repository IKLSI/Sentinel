import React from 'react'
import Box from '@mui/material/Box'
import { HealthGrade } from '../types'

interface HealthScoreCircleProps {
  score: number
  grade: HealthGrade
  size?: number
}

const gradeColor: Record<HealthGrade, string> = {
  A: 'var(--green)',
  B: 'var(--cyan)',
  C: 'var(--yellow)',
  D: 'var(--orange)',
  F: 'var(--red)',
}

export const HealthScoreCircle: React.FC<HealthScoreCircleProps> = ({ score, grade, size = 44 }) => {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = gradeColor[grade]

  return (
    <Box className="position-relative" sx={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--s3)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={3} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <Box
        className="position-absolute d-flex align-items-center justify-content-center"
        sx={{ inset: 0, fontFamily: 'var(--font-mono)', fontSize: size > 44 ? '14px' : '12px', fontWeight: 700, color }}
      >
        {grade}
      </Box>
    </Box>
  )
}
