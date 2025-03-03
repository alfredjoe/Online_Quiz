import React, { useState } from 'react';

const CreateTest = () => {
    const [testName, setTestName] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Test Created:', { testName, question, answer });
        setTestName('');
        setQuestion('');
        setAnswer('');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Create Test</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="test-name" className="block text-sm font-medium text-gray-700">Test Name:</label>
                    <input 
                        type="text" 
                        id="test-name" 
                        name="test-name" 
                        value={testName} 
                        onChange={(e) => setTestName(e.target.value)} 
                        required 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700">Question:</label>
                    <textarea 
                        id="question" 
                        name="question" 
                        value={question} 
                        onChange={(e) => setQuestion(e.target.value)} 
                        required 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="answer" className="block text-sm font-medium text-gray-700">Answer:</label>
                    <textarea 
                        id="answer" 
                        name="answer" 
                        value={answer} 
                        onChange={(e) => setAnswer(e.target.value)} 
                        required 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    ></textarea>
                </div>
                <button type="submit" className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md">Add Question</button>
            </form>
        </div>
    );
};

export default CreateTest;
