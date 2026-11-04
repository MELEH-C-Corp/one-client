import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes, SVGProps } from 'react'

// The ONE wordmark, set in Grenze Gotisch and outlined to paths (brand/logo/ONE-wordmark.svg).
function Logo({ onClick }: { onClick?: () => void }) {
  // Explicit size (wordmark is 1677:632): an <img> in this flex row otherwise shrinks to 0px.
  return (
    <img
      src="/meleh-wordmark.svg"
      alt="MELEH ONE"
      width={58}
      height={22}
      onClick={onClick}
      style={{ cursor: 'pointer', width: 58, height: 22, flexShrink: 0 }}
    />
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
  return (
    <Container clickable={clickable}>
      <Logo onClick={onClick} />
    </Container>
  )
}
