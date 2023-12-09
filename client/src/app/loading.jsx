

export default function Loading(){
  return (
    <div className='w-full min-h-screen flex relative ' style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
        <img className='w-[200px] h-[200px] absolute top-[50%] left-[50%]' src='https://i.gifer.com/OH2e.gif'/>
        <div className='bg-black opacity-60 absolute w-full h-full'></div>
        <h1 className="absolute">Cargando...</h1>
    </div>
  )
}

