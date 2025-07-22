import { LoginRequest, LoginResponse } from "../../../../domain/types/auth";
import { loginEndpoint } from "../../endpoints/AuthEndpoints";
import useApi from "../../hooks/useApi";

export const loginRequest = async({requestBody}:{requestBody:LoginRequest}) => {
    try{
        const response = await useApi({
            url: loginEndpoint,
            method: 'POST', 
            data: requestBody,
        });
        return response.data as LoginResponse;
    }catch(error){
        throw error;
    }
}
