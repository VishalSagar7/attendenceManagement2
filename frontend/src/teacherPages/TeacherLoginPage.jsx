import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "sonner";
import { FaRegEyeSlash } from "react-icons/fa";
import { FaRegEye } from "react-icons/fa";
import { addTeacherInfo } from "../store/teacherSlice";
import { useDispatch } from "react-redux";
import {Link} from 'react-router-dom'


const TeacherLogin = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        

        if (!formData.email || !formData.password) {
            setError("Both fields are required");
            toast.warning('Both fields are required');
            return;
        }

        setLoading(true);

        try {
            const res = await axiosInstance.post(`/api/teacher/login`, formData);
            if (res?.data?.success) {
                toast.success(res?.data?.message);
                dispatch(addTeacherInfo(res?.data?.teacher));
                
            }
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="card w-96 bg-white shadow-xl p-6">
                <h2 className="text-2xl font-bold text-center mb-4">Teacher Login</h2>

                {error && <div className="text-red-500 text-sm text-center mb-2">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="w-full mb-4">
                        <label className="block text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input input-bordered w-full pr-12"  // Increased padding-right for spacing
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                disabled={loading}
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[50%] transform translate-y-[-50%] text-gray-500 hover:text-gray-700 flex items-center"
                            >
                                {showPassword ? <FaRegEyeSlash size={22} /> : <FaRegEye size={22} />}
                            </button>
                        </div>
                    </div>


                    {/* Submit Button */}
                    <button
                        type="submit" 
                        className="btn btn-primary w-full"
                    >
                        {
                            loading ? <span className="loading loading-spinner loading-md"></span> : `Login`
                        }
                    </button>

                    <Link to={"/studentlogin"} className=" link-primary text-xs">Go to student login</Link>
                </form>
            </div>
        </div>
    );
};

export default TeacherLogin;
