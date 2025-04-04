import * as React from "react"
import { cn } from "../lib/utils"

const StepperContext = React.createContext<{
  value: number
  onValueChange: (value: number) => void
  maxSteps: number
}>({
  value: 0,
  onValueChange: () => {},
  maxSteps: 0,
})

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  onValueChange: (value: number) => void
  children: React.ReactNode
}

export function Stepper({ value, onValueChange, children, className, ...props }: StepperProps) {
  const childrenArray = React.Children.toArray(children)
  const maxSteps = childrenArray.length

  return (
    <StepperContext.Provider value={{ value, onValueChange, maxSteps }}>
      <div className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    </StepperContext.Provider>
  )
}

export interface StepperContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  children: React.ReactNode
}

export function StepperContent({ value, children, className, ...props }: StepperContentProps) {
  const { value: currentValue } = React.useContext(StepperContext)

  if (value !== currentValue) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
}

export interface StepperHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function StepperHeader({ children, className, ...props }: StepperHeaderProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {children}
    </div>
  )
}

export interface StepperTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export function StepperTitle({ children, className, ...props }: StepperTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h3>
  )
}

export interface StepperDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export function StepperDescription({ children, className, ...props }: StepperDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

export interface StepperFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function StepperFooter({ children, className, ...props }: StepperFooterProps) {
  return (
    <div className={cn("flex items-center justify-between space-x-4 pt-4", className)} {...props}>
      {children}
    </div>
  )
}

export interface StepperNavigationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function StepperPrevious({ children, className, ...props }: StepperNavigationButtonProps) {
  const { value, onValueChange } = React.useContext(StepperContext)

  return (
    <button
      type="button"
      onClick={() => onValueChange(Math.max(0, value - 1))}
      disabled={value === 0}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function StepperNext({ children, className, ...props }: StepperNavigationButtonProps) {
  const { value, onValueChange, maxSteps } = React.useContext(StepperContext)

  return (
    <button
      type="button"
      onClick={() => onValueChange(Math.min(maxSteps - 1, value + 1))}
      disabled={value === maxSteps - 1}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
} 