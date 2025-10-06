import React, { useContext } from 'react'
import { UserContext } from './Login'


export default function Component1() {
    const email = useContext(UserContext);
  return (
    <div>
      <h1>email: {email}</h1>
    </div>
  )
}
