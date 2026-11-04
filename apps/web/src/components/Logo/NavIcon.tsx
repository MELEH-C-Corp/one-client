import { Flex, type FlexCompatProps, useSporeColors } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes, SVGProps } from 'react'

function Logo({ color, onClick }: { color: string; onClick?: () => void }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      onClick={onClick}
      cursor="pointer"
      aria-label="MELEH ONE"
    >
      <rect width="22" height="22" rx="6" fill={color} />
      <path
        d="M5.5 15.5V6.5L11 12L16.5 6.5V15.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type ContainerProps = FlexCompatProps & { clickable?: boolean }

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit
// (TS2883) — its structural expansion reaches mycelium-internal prop-composition types.
const Container: ForwardRefExoticComponent<ContainerProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  ContainerProps
>(function Container({ clickable, ...rest }, ref) {
  return (
    <Flex
      ref={ref}
      position="relative"
      justifyContent="center"
      alignItems="center"
      cursor="auto"
      // Legacy `clickable` variant was `true`-only, so `false`/undefined is a no-op. Applied
      // after the base and before the caller's props to keep the legacy factory's precedence.
      {...(clickable ? { cursor: 'pointer' as const } : {})}
      {...rest}
    />
  )
})

type NavIconProps = SVGProps<SVGSVGElement> & {
  clickable?: boolean
  onClick?: () => void
}

export const NavIcon = ({ clickable, onClick }: NavIconProps) => {
  const colors = useSporeColors()

  return (
    <Container clickable={clickable}>
      <Logo color={colors.accent1.val} onClick={onClick} />
    </Container>
  )
}
