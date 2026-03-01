import {useState} from 'react'
import './FeedbackForm.css'; // Import CSS for styling
import FetchData from './fetchData';
import FetchData_use from './fetchData_use'
//test version 1.0
//except achive the function: 
//1. user can submit a form with data included 'date', 'country','statistical method' to the form
//2. then the form use Submit action to call a data fetch function, 
// fetch funciton takes the form data as the paramater to create links
//then use 'use' function to enetuallly return the data in json fromat as a card infromation on the web page.
const RequestFrom = () => {
    const [requestData, setRequestData] = useState({
        date: '',
        region: '',
    })
    const [dataCard, setDataCard] = useState([]);

    //handle the content update in form
    function handleChange(e){
        const {name, value} = e.target;
        setRequestData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    function handleSubmit(e){
        //stop refreshing data!!
        e.preventDefault()
        const date = requestData.date.trim();
        const region = requestData.region.trim();
        //here should give the requestData to fetchdata to fetch the data.
        if (date !== '' && region !== ''){
            setDataCard(prev => [...prev, requestData])
        }
        setRequestData({
            date: '',
            region: '',
        });
    }

    return (
        <>
        <h1>Hi this is the test for fetching the data form JHT's database</h1>
        <form className='feedback-form' onSubmit={handleSubmit}>
            <p>Please set a country to fetch data</p>
            <input 
            type="text"
            name='date'
            placeholder='type a date'
            onChange={handleChange}
            value={requestData.date} />
            <input 
            type="text"
            name='region'
            placeholder='type a region'
            onChange={handleChange}
            value={requestData.region} />
            <button type="submit">Submit Feedback</button>
        </form>
        {/* display data card: */}
        <div className='dataCard'>
            {dataCard.map((card, idx) => (
                <div className='card' key={`${card.date}-${card.region}-${idx}`}>
                    {/* <FetchData date={card.date} region={card.region}/> */}
                    <FetchData_use date={card.date} region={card.region}/>
                </div>
            ))}
        </div>
        </>
    )
}
export default RequestFrom;