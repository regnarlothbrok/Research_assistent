import axios from 'axios';
import { SearchResponse, ChatResponse } from '../types';

const API_URL = 'http://localhost:8000'; // Make sure this matches your FastAPI server port

export const chatWithAssistant = async (topic: string, message: string): Promise<ChatResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/chat/${topic}`, {
      message: message
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw new Error('Failed to send message. Please try again.');
  }
};

export const searchPapers = async (
  topic: string,
  maxResults: number = 10,
  years: number = 5
): Promise<SearchResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/research/${topic}`, {
      topic,
      max_results: maxResults,
      years,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Search API Error:', error);
    throw new Error('Failed to fetch papers. Please try again.');
  }
};