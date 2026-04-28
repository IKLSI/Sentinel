import React from 'react'
import Box from '@mui/material/Box'
import type { SvgIconComponent } from '@mui/icons-material'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined'
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined'
import { HealthGrade } from '../types'

interface HealthScoreCircleProps {
  score: number
  grade: HealthGrade
  size?: number
}

const gradeConfig: Record<HealthGrade, { color: string; Icon: SvgIconComponent }> = {
  F: { color: '#dc2626', Icon: WarningAmberOutlined },
  E: { color: '#ea580c', Icon: WarningAmberOutlined },
  D: { color: '#d97706', Icon: ErrorOutlineOutlined },
  C: { color: '#ca8a04', Icon: ErrorOutlineOutlined },
  B: { color: '#4f46e5', Icon: CheckCircleOutlineOutlined },
  A: { color: '#10b981', Icon: CheckCircleOutlineOutlined },
}

export const HealthScoreCircle: React.FC<HealthScoreCircleProps> = ({ score, grade, size = 44 }) => {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const cfg = gradeConfig[grade] ?? gradeConfig['F']
  const { color, Icon } = cfg
  const iconSize = Math.round(size * 0.38)

  return (
    <Box className="position-relative" sx={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--s3)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={3} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <Box
        className="position-absolute d-flex align-items-center justify-content-center"
        sx={{ inset: 0, color }}
      >
        <Icon sx={{ fontSize: iconSize }} />
      </Box>
    </Box>
  )
}
