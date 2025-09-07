package com.research.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.research.helper.GeminiResponse;
import com.research.helper.ResearchRequest;

@Service
public class ResearchService 
{
	
	@Value("${gemini.api.url}")
	private String geminiApiUrl;
	
	@Value("${gemini.api.key}")
	private String geminiApiKey;
	
	private final WebClient webClient;
	
	private final ObjectMapper objectMapper;
	
	public ResearchService(WebClient.Builder webClientBuilder,ObjectMapper objectMapper) {
		
		this.webClient= webClientBuilder.build();
		
		this.objectMapper=objectMapper;
	}

	public String processContent(ResearchRequest request) 
	{
		
		System.out.println("Request is coming");
		//build the prompt
		String prompt = buildPrompt(request);
		
		
		//query the ai model
        Map<String, Object> requestBody=Map.of("contents",new Object [] 
        		{
        				Map.of("parts",new Object [] 
        						{
        								Map.of("text", prompt)
        						}
        				      )
		        }
	);
        
        String response=webClient.post()
        		.uri(geminiApiUrl+geminiApiKey)
        		.bodyValue(requestBody)
        		.retrieve()
        		.bodyToMono(String.class)
        		.block();
        
		//parse the response
        //return response
		String finalResponse=extractTextFromResponse(response);
		
		return finalResponse;
	}
	
	private String extractTextFromResponse(String response) 
	{
		try 
		{
			 GeminiResponse geminiResponse=objectMapper.readValue(response, GeminiResponse.class);
			 
			 if(geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty())
			 {
				 GeminiResponse.Candidate firstCandidate= geminiResponse.getCandidates().get(0);
				 
				 if(firstCandidate.getContent() != null && firstCandidate.getContent().getParts()!= null && !firstCandidate.getContent().getParts().isEmpty())
				 {
					 return firstCandidate.getContent().getParts().get(0).getText();
				 }
			 }
			 
			 return "No Content Foud in Response";
		} 
		catch (Exception e) 
		{
			return "Error Parsing: "+e.getMessage();
		}
	}

	private String buildPrompt(ResearchRequest request)
	{
		StringBuilder prompt=new StringBuilder();
		
		switch (request.getOperation()) 
		{
		    case "summarize" : 
		    {
		    	prompt.append("Explain following text in a clear and simple way. Give me: A short definition (2–3 lines)."
		    			+ "Key points in bullet form."
		    			+ "A simple example (if possible)."
		    			+ "One or two real-life uses."
		    			+ "Keep it easy to understand, like quick revision notes\n\n");
		    	break;
		    }
		    
		    case "suggest":
		    {
		    	prompt.append("Suggest me improvements or best practices based on following content. Give me: "
		    			+ "Key mistakes to avoid."
		    			+ "Best practices (bullet points)."
		    			+ "Small examples (if needed)."
		    			+ "Final quick recommendation (1–2 lines).");
		    	 break;
		    }
		    
		    default :
		    	throw new IllegalArgumentException("Unkown Operation: "+request.getOperation());
		}
		
		prompt.append(request.getContent());
		
		return prompt.toString();
	}

}
