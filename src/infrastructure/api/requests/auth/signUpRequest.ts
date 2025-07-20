import { SignUpRequest, SignUpResponse } from "../../../../domain/types/auth";
import { signUpEndpoint } from "../../endpoints/AuthEndpoints";
import useApi from "../../hooks/useApi";

export const signUpRequest = async({requestBody}:{requestBody:SignUpRequest}) => {
    try{
        const response = await useApi({
            url: signUpEndpoint,
            method: 'POST',
            data: requestBody,
        });
        return response.data as SignUpResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}