import { useState } from 'react'
import AppBar from '../components/AppBar'
import UIBlock from '../components/UIBlock'

export default function Index() {
  const [router, setRouter] = useState('/addLiquidity')
  /**
   * @dev workaround for avoid server side render.
   */
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null

  return (
    <div>
      <AppBar setRouter={setRouter} />
      <UIBlock router={router} />
    </div>
  )
}
