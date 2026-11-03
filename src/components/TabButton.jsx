import React, { Children } from 'react'

const TabButton = ({Children}) => {
    function handleClick(){
        console.log("Hello World")
    }
  return (
    <div>
        <li>
            <button onClick={handleClick}>{Children}</button>
        </li>
    </div>
  )
}

export default TabButton